import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

const SOCKET_SERVER_URL = 'http://localhost:8081';

/**
 * Socket.io Service for real-time communication between frontend and backend
 * Handles text-to-speech requests and responses via Socket.io
 */
@Injectable({
    providedIn: 'root'
})
export class SocketioService {
    private socket: Socket | null = null;
    private speechGeneratedSubject = new Subject<any>();
    private speechErrorSubject = new Subject<any>();

    constructor() {
        this.initializeSocket();
    }

    /**
     * Initialize Socket.io connection to backend
     */
    private initializeSocket(): void {
        if (!this.socket) {
            this.socket = io(SOCKET_SERVER_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                transports: ['websocket', 'polling']
            });

            this.setupListeners();
        }
    }

    /**
     * Setup Socket.io event listeners
     */
    private setupListeners(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to Socket.io server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Socket.io server');
        });

        this.socket.on('speech-generated', (data) => {
            console.log('Speech generated successfully');
            this.speechGeneratedSubject.next(data);
        });

        this.socket.on('speech-error', (data) => {
            console.error('Error generating speech:', data.error);
            this.speechErrorSubject.next(data);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.io connection error:', error);
        });
    }

    /**
     * Check if Socket.io is connected
     * @returns {boolean} - True if connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Ensure socket is connected, try to reconnect if not
     */
    ensureConnection(): Promise<void> {
        return new Promise((resolve) => {
            if (this.socket?.connected) {
                resolve();
            } else if (this.socket) {
                // Wait for connection with timeout
                const timeout = setTimeout(() => {
                    console.warn('Socket connection timeout');
                    resolve();
                }, 5000);

                this.socket.once('connect', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            } else {
                this.initializeSocket();
                resolve();
            }
        });
    }

    /**
     * Request speech generation for recipe instructions
     * @param {string} recipeTitle - Title of the recipe
     * @param {string[]} instructions - Array of instruction strings
     * @param {Object} options - Additional options
     * @returns {Observable<any>} - Observable of speech-generated event
     */
    requestSpeech(recipeTitle: string, instructions: string[], options: any = {}): Observable<any> {
        return new Observable(observer => {
            this.ensureConnection().then(() => {
                if (this.socket) {
                    // Subscribe to response events
                    const speechGenSub = this.speechGeneratedSubject.subscribe(data => {
                        observer.next(data);
                        observer.complete();
                        cleanup();
                    });

                    const speechErrSub = this.speechErrorSubject.subscribe(data => {
                        observer.error(data);
                        cleanup();
                    });

                    const cleanup = () => {
                        speechGenSub.unsubscribe();
                        speechErrSub.unsubscribe();
                    };

                    // Emit request
                    this.socket.emit('generate-speech', {
                        recipeTitle: recipeTitle,
                        instructions: instructions,
                        languageCode: options.languageCode || 'en-US',
                        voiceName: options.voiceName || 'en-US-Neural2-A',
                        speakingRate: options.speakingRate || 1.0
                    });

                    // Cleanup on unsubscribe
                    return () => {
                        cleanup();
                    };
                } else {
                    observer.error({ error: 'Failed to establish Socket.io connection' });
                    return undefined;
                }
            }).catch(() => {
                observer.error({ error: 'Failed to connect to server' });
            });
        });
    }

    /**
     * Get speech-generated event observable
     * @returns {Observable<any>} - Observable of speech-generated events
     */
    getSpeechGenerated(): Observable<any> {
        return this.speechGeneratedSubject.asObservable();
    }

    /**
     * Get speech-error event observable
     * @returns {Observable<any>} - Observable of speech-error events
     */
    getSpeechError(): Observable<any> {
        return this.speechErrorSubject.asObservable();
    }

    /**
     * Disconnect from Socket.io server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    /**
     * Reconnect to Socket.io server
     */
    reconnect(): void {
        if (this.socket) {
            this.socket.connect();
        } else {
            this.initializeSocket();
        }
    }
}
