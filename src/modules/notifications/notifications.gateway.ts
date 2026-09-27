import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      // Har bir user o'zining ID'si bo'yicha xonaga qo'shiladi
      client.join(`user_${userId}`);
      this.logger.log(`Client connected and joined room user_${userId}: ${client.id}`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Bu funksiya orqali backend'dan notification jo'natamiz
  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('new-notification', notification);
    this.logger.debug(`Notification sent to user_${userId}`);
  }
}
