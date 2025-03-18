// app/api/calendar/add-events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import Anthropic from '@anthropic-ai/sdk';

// Setup environment variables
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';

// WordPress API credentials
const WP_API_URL = process.env.WP_API_URL || 'https://sainthelen.org/wp-json/tribe/events/v1';
const WP_AUTH_USERNAME = process.env.WP_AUTH_USERNAME || '';
const WP_AUTH_PASSWORD = process.env.WP_AUTH_PASSWORD || '';

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Interface for WordPress event data
interface EventData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  website?: string;
  featured?: boolean;
}

// Interface for our response data
interface EventResult {
  recordId: string;
  eventId: number;
  eventUrl: string;
  editUrl: string;
}

// Safe conversion to string for any field value
function safeToString(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
}

/**
 * Formats event description using Claude AI
 */
async function generateEventDescription(record: Airtable.Record<any>): Promise<string> {
  try {
    // Generate a prompt for Claude
    const announcementText = safeToString(record.get('Announcement Body'));
    const ministry = safeToString(record.get('Ministry'));
    const date = safeToString(record.get('Date of Event'));
    const time = safeToString(record.get('Time of Event'));
    
    const prompt = `
You are helping format an announcement into a well-structured event description for a WordPress site. 
Please convert the following announcement into a proper event description following these rules:
1. Maintain a warm, inviting tone consistent with Saint Helen's brand
2. Include all important details (time, location, contact info)
3. Format with proper spacing and paragraphs
4. Keep it concise but informative
5. Include a clear call-to-action if relevant

Here's the announcement text:
${announcementText}

Ministry: ${ministry || 'N/A'}
Date: ${date || 'N/A'}
Time: ${time || 'N/A'}

Please provide ONLY the formatted description text with no additional commentary.
`.trim();

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the response text
    let formattedDescription = '';
    if (typeof response.content === 'string') {
      formattedDescription = response.content;
    } else if (Array.isArray(response.content)) {
      formattedDescription = response.content
        .map((item: any) => (item?.text ? item.text : ''))
        .join('\n');
    } else {
      formattedDescription = JSON.stringify(response.content);
    }

    return formattedDescription.trim();
  } catch (error) {
    console.error('Error generating event description:', error);
    // Fallback to original announcement text
    return safeToString(record.get('Announcement Body'));
  }
}

/**
 * Creates an event in The Events Calendar via WordPress REST API
 */
async function createWordPressEvent(eventData: EventData): Promise<any> {
  // Basic auth credentials
  const authString = Buffer.from(`${WP_AUTH_USERNAME}:${WP_AUTH_PASSWORD}`).toString('base64');
  
  try {
    // Call WordPress REST API to create event
    const response = await fetch(`${WP_API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create event: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WordPress API error:', error);
    throw error;
  }
}

/**
 * Parse date and time into WordPress format
 */
function parseDateTime(dateStr: string, timeStr: string): string {
  try {
    // Handle different date formats
    let dateObj: Date;
    
    // If format is MM/DD/YY
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      const fullYear = parseInt(year) < 100 ? 2000 + parseInt(year) : parseInt(year);
      dateObj = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    } 
    // If format is YYYY-MM-DD
    else if (dateStr.includes('-')) {
      dateObj = new Date(dateStr);
    } 
    // Fallback to current date
    else {
      dateObj = new Date();
    }

    // Add time if available
    if (timeStr && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      dateObj.setHours(parseInt(hours));
      dateObj.setMinutes(parseInt(minutes));
    }

    // Format for WordPress
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error parsing date/time:', error);
    return new Date().toISOString();
  }
}

/**
 * Calculate end date (1 hour after start date by default)
 */
function calculateEndDate(startDateISO: string): string {
  try {
    const startDate = new Date(startDateISO);
    const endDate = new Date(startDate);
    
    // Default duration is 1 hour if no specific duration is provided
    endDate.setHours(endDate.getHours() + 1);
    
    return endDate.toISOString();
  } catch (error) {
    console.error('Error calculating end date:', error);
    // Fallback: return a date 1 hour after now
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { recordIds } = await request.json();

    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No record IDs provided' },
        { status: 400 }
      );
    }

    // Array to store results
    const results: EventResult[] = [];
    const errors: { recordId: string; error: string }[] = [];

    // Process each announcement
    for (const recordId of recordIds) {
      try {
        // Fetch the announcement from Airtable
        const record = await base(ANNOUNCEMENTS_TABLE).find(recordId);
        
        // Skip if missing critical data
        const announcementBody = record.get('Announcement Body');
        const eventDate = record.get('Date of Event');
        
        if (!announcementBody || !eventDate) {
          errors.push({
            recordId,
            error: 'Missing required fields (announcement body or event date)'
          });
          continue;
        }

        // Generate optimized description using Claude
        const description = await generateEventDescription(record);
        
        // Parse start date and time
        const startDate = parseDateTime(
          safeToString(record.get('Date of Event')), 
          safeToString(record.get('Time of Event'))
        );
        
        // Calculate end date (1 hour after start by default)
        const endDate = calculateEndDate(startDate);
        
        // Create event data object
        const eventData: EventData = {
          title: safeToString(record.get('Name') || 'Unnamed Event'),
          description,
          start_date: startDate,
          end_date: endDate,
          status: 'draft',
          website: '',
          featured: false
        };

        // Create the event in WordPress
        const wpResponse = await createWordPressEvent(eventData);
        
        // Store success result
        results.push({
          recordId,
          eventId: wpResponse.id,
          eventUrl: wpResponse.url,
          editUrl: `https://sainthelen.org/wp-admin/post.php?post=${wpResponse.id}&action=edit`
        });

        // Update Airtable record to indicate event was created
        await base(ANNOUNCEMENTS_TABLE).update([
          {
            id: recordId,
            fields: {
              'WordPress Event ID': wpResponse.id,
              'WordPress Event URL': wpResponse.url
            }
          }
        ]);
      } catch (error: any) {
        console.error(`Error processing announcement ${recordId}:`, error);
        errors.push({
          recordId,
          error: error.message || 'Unknown error creating event'
        });
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      results,
      errors,
      message: `Created ${results.length} events, with ${errors.length} errors.`
    });
  } catch (error: any) {
    console.error('Error in add-events route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create events' },
      { status: 500 }
    );
  }
}