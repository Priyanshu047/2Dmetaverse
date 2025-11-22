import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import { GameSession, GamePlayer, QuizQuestion } from '@metaverse/shared';

export class QuizScene extends Phaser.Scene {
    private socket!: Socket;
    private session!: GameSession;
    private userId!: string;

    // UI Elements
    private container!: Phaser.GameObjects.Container;
    private questionText!: Phaser.GameObjects.Text;
    private optionsContainer!: Phaser.GameObjects.Container;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'QuizScene' });
    }

    init(data: { socket: Socket; session: GameSession; userId: string }) {
        this.socket = data.socket;
        this.session = data.session;
        this.userId = data.userId;
        console.log('🧠 QuizScene initialized', this.session);
    }

    create() {
        // Create semi-transparent background overlay
        const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        bg.setInteractive(); // Block clicks to world

        // Main Container
        this.container = this.add.container(0, 0);

        // Title
        const title = this.add.text(400, 50, '🧠 QUIZ TIME', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(title);

        // Exit Button
        const exitBtn = this.add.text(750, 30, '❌ Exit', {
            fontSize: '20px',
            color: '#ff0000',
            backgroundColor: '#ffffff'
        })
            .setPadding(10)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.leaveGame());
        this.container.add(exitBtn);

        // Status Text
        this.statusText = this.add.text(400, 100, 'Waiting for players...', {
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        this.container.add(this.statusText);

        // Question Text
        this.questionText = this.add.text(400, 180, '', {
            fontSize: '24px',
            color: '#ffffff',
            wordWrap: { width: 600 },
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.questionText);

        // Options Container
        this.optionsContainer = this.add.container(0, 0);
        this.container.add(this.optionsContainer);

        // Score Board
        this.scoreText = this.add.text(50, 50, 'Scores:', {
            fontSize: '16px',
            color: '#ffff00'
        });
        this.container.add(this.scoreText);

        // Start Game Button (if waiting)
        if (this.session.state === 'waiting') {
            const startBtn = this.add.text(400, 500, 'START GAME', {
                fontSize: '24px',
                color: '#000000',
                backgroundColor: '#00ff00'
            })
                .setPadding(15)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.socket.emit('game:action', {
                        gameSessionId: this.session.sessionId,
                        actionType: 'start_game',
                        payload: {}
                    });
                    startBtn.destroy();
                });
            this.container.add(startBtn);
        }

        // Setup Socket Listeners
        this.setupSocketListeners();

        // Initial Render
        this.updateUI();
    }

    private setupSocketListeners() {
        this.socket.on('game:state', (state: GameSession) => {
            this.session = state;
            this.updateUI();
        });

        this.socket.on('game:update', (update: any) => {
            if (update.type === 'player_joined' || update.type === 'player_left') {
                // Update player list in session if needed, or request full state
                // For simplicity, let's assume full state sync or manual update
                if (update.players) this.session.players = update.players;
                this.updateScores();
            } else if (update.type === 'score_update') {
                this.session.players = update.players;
                this.updateScores();

                // Show feedback
                if (update.lastAnswer) {
                    const isMe = update.lastAnswer.playerId === this.userId;
                    const color = update.lastAnswer.correct ? '#00ff00' : '#ff0000';
                    const text = update.lastAnswer.correct ? 'CORRECT!' : 'WRONG!';

                    if (isMe) {
                        this.showFeedback(text, color);
                    }
                }
            } else if (update.type === 'next_question') {
                this.session.currentQuestionIndex = update.currentQuestionIndex;
                this.updateUI();
            }
        });

        this.socket.on('game:ended', (data: { finalScores: GamePlayer[] }) => {
            this.session.state = 'finished';
            this.session.players = data.finalScores;
            this.showGameOver();
        });
    }

    private updateUI() {
        this.updateScores();

        if (this.session.state === 'waiting') {
            this.statusText.setText(`Waiting for players... (${this.session.players.length} joined)`);
            this.questionText.setText('');
            this.optionsContainer.removeAll(true);
        } else if (this.session.state === 'in-progress') {
            this.statusText.setText(`Question ${this.session.currentQuestionIndex! + 1}`);
            this.renderQuestion();
        }
    }

    private renderQuestion() {
        if (!this.session.questions || this.session.currentQuestionIndex === undefined) return;

        const q = this.session.questions[this.session.currentQuestionIndex];
        this.questionText.setText(q.question);

        this.optionsContainer.removeAll(true);

        q.options.forEach((opt, idx) => {
            const y = 250 + (idx * 60);
            const bg = this.add.rectangle(400, y, 500, 50, 0x333333)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => bg.setFillStyle(0x555555))
                .on('pointerout', () => bg.setFillStyle(0x333333))
                .on('pointerdown', () => this.submitAnswer(idx));

            const text = this.add.text(400, y, opt, {
                fontSize: '20px',
                color: '#ffffff'
            }).setOrigin(0.5);

            this.optionsContainer.add(bg);
            this.optionsContainer.add(text);
        });
    }

    private submitAnswer(index: number) {
        // Disable interaction temporarily
        this.optionsContainer.each((child: any) => child.disableInteractive());

        this.socket.emit('game:action', {
            gameSessionId: this.session.sessionId,
            actionType: 'submit_answer',
            payload: { answerIndex: index }
        });
    }

    private updateScores() {
        const scores = this.session.players
            .map(p => `${p.name}: ${p.score}`)
            .join('\n');
        this.scoreText.setText(`Scores:\n${scores}`);
    }

    private showFeedback(text: string, color: string) {
        const feedback = this.add.text(400, 300, text, {
            fontSize: '48px',
            fontStyle: 'bold',
            color: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: feedback,
            y: 250,
            alpha: 0,
            duration: 1500,
            onComplete: () => feedback.destroy()
        });
    }

    private showGameOver() {
        this.optionsContainer.removeAll(true);
        this.questionText.setText('GAME OVER');

        // Sort winners
        const sorted = [...this.session.players].sort((a, b) => b.score - a.score);
        const winner = sorted[0];

        this.statusText.setText(`Winner: ${winner.name} (${winner.score} pts)`);
    }

    private leaveGame() {
        this.socket.emit('game:leave', { gameSessionId: this.session.sessionId });
        this.scene.stop();
        this.scene.resume('RoomScene');
    }
}
