import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Database, TextToSpeechResponse } from '../../../services/database';
import { SocketioService } from '../../../services/socketio.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-text-to-speech',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './text-to-speech.html',
    styleUrls: ['./text-to-speech.css']
})
export class TextToSpeech implements OnInit, OnDestroy {
    @Input() recipeTitle: string = '';
    @Input() instructions: string[] = [];
    @Input() userId: string = '';

    // Audio state
    audioUrl: string = '';
    isPlaying: boolean = false;
    audioElement: HTMLAudioElement | null = null;
    currentTime: number = 0;
    duration: number = 0;
    volume: number = 1.0;

    // Loading and error states
    isGenerating: boolean = false;
    error: string = '';
    successMessage: string = '';

    // Voice options
    selectedVoice: string = 'en-US-Neural2-A';
    speakingRate: number = 1.0;
    availableVoices = [
        { name: 'English US (Male)', value: 'en-US-Neural2-A' },
        { name: 'English US (Female)', value: 'en-US-Neural2-C' },
    ];

    private destroy$ = new Subject<void>();

    constructor(
        private database: Database,
        private socketioService: SocketioService
    ) { }

    ngOnInit(): void {
        // Create audio element
        this.audioElement = new Audio();
        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement?.currentTime || 0;
        });
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement?.duration || 0;
        });
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
        });
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
        });
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            this.currentTime = 0;
        });
    }

    ngOnDestroy(): void {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
        }
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Generate speech for recipe instructions via REST API
     */
    generateSpeech(): void {
        if (!this.instructions || this.instructions.length === 0) {
            this.error = 'No instructions available for text-to-speech';
            return;
        }

        this.isGenerating = true;
        this.error = '';
        this.successMessage = '';

        this.database.generateRecipeSpeech(
            this.instructions,
            this.recipeTitle,
            this.userId,
            {
                voiceName: this.selectedVoice,
                speakingRate: this.speakingRate
            }
        )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: TextToSpeechResponse) => {
                    if (response.success && response.data) {
                        // Convert base64 to blob and create object URL
                        const binaryString = atob(response.data.audioBase64);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], { type: 'audio/mpeg' });
                        this.audioUrl = URL.createObjectURL(blob);

                        if (this.audioElement) {
                            this.audioElement.src = this.audioUrl;
                        }

                        this.successMessage = 'Speech generated successfully! Ready to play.';
                        this.isGenerating = false;
                    } else {
                        this.error = response.error || 'Failed to generate speech';
                        this.isGenerating = false;
                    }
                },
                error: (err: any) => {
                    console.error('Error generating speech:', err);
                    this.error = 'Failed to generate speech. Please try again.';
                    this.isGenerating = false;
                }
            });
    }

    /**
     * Play or pause the audio
     */
    togglePlayPause(): void {
        if (!this.audioElement) return;

        if (this.isPlaying) {
            this.audioElement.pause();
        } else {
            this.audioElement.play().catch(err => {
                console.error('Error playing audio:', err);
                this.error = 'Failed to play audio';
            });
        }
    }

    /**
     * Stop the audio and reset
     */
    stopAudio(): void {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.isPlaying = false;
            this.currentTime = 0;
        }
    }

    /**
     * Set volume
     */
    setVolume(newVolume: number): void {
        this.volume = newVolume;
        if (this.audioElement) {
            this.audioElement.volume = newVolume;
        }
    }

    /**
     * Seek to a specific time in the audio
     */
    seek(time: number): void {
        if (this.audioElement) {
            this.audioElement.currentTime = time;
        }
    }

    /**
     * Format time in MM:SS format
     */
    formatTime(seconds: number): string {
        if (!seconds || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * Get progress percentage
     */
    getProgressPercentage(): number {
        if (!this.duration) return 0;
        return (this.currentTime / this.duration) * 100;
    }

    /**
     * Clear error message
     */
    clearError(): void {
        this.error = '';
    }

    /**
     * Clear success message
     */
    clearSuccess(): void {
        this.successMessage = '';
    }

    /**
     * Handle progress bar click to seek to position
     */
    onProgressClick(event: MouseEvent): void {
        if (!this.duration || !event.currentTarget) return;

        const progressBar = event.currentTarget as HTMLElement;
        const clickX = event.offsetX;
        const totalWidth = progressBar.offsetWidth;
        const clickPercentage = clickX / totalWidth;
        const seekTime = clickPercentage * this.duration;

        this.seek(seekTime);
    }
}
