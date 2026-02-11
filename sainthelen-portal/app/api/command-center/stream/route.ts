// app/api/command-center/stream/route.ts

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

/**
 * GET /api/command-center/stream
 * Server-Sent Events endpoint for real-time Command Center updates
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectEvent = {
        type: 'connected',
        data: { message: 'Connected to Command Center stream' },
        timestamp: new Date().toISOString(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectEvent)}\n\n`));

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = {
            type: 'heartbeat',
            data: {},
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
        } catch (error) {
          // Connection closed, clear interval
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Helper function to create stream events (for use in other files)
// Note: In a production environment, you would use a pub/sub system like Redis
// to broadcast events across multiple server instances. For simplicity,
// this implementation uses polling on the client side as a fallback.
