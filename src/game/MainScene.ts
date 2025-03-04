import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private paddle!: Phaser.GameObjects.Rectangle;
  private ball!: Phaser.GameObjects.Arc;
  private bricks!: Phaser.GameObjects.Rectangle[];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private score: number = 0;
  private lives: number = 3;
  private paddleSpeed: number = 400;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.paddle = this.add.rectangle(
      400, 550, 100, 20, 0x00ff00
    );
    this.physics.add.existing(this.paddle, true);

    this.ball = this.add.circle(400, 300, 10, 0xff0000);
    this.physics.add.existing(this.ball);
    (this.ball.body as Phaser.Physics.Arcade.Body).setBounce(1, 1);
    (this.ball.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(200, -200);

    this.bricks = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 8; j++) {
        const brick = this.add.rectangle(
          80 + j * 90,
          60 + i * 30,
          80,
          20,
          0x0000ff
        );
        this.physics.add.existing(brick, true);
        this.bricks.push(brick);
      }
    }

    this.physics.add.collider(this.ball, this.paddle);
    this.bricks.forEach(brick => {
      this.physics.add.collider(this.ball, brick, () => this.hitBrick(brick), undefined, this);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', color: '#ffffff' });
    this.livesText = this.add.text(this.sys.game.config.width as number - 16, 16, 'Lives: 3', { fontSize: '32px', color: '#ffffff' }).setOrigin(1, 0);
  }

  update(_time: number, delta: number) {
    // Paddle movement with delta time for smooth movement
    const deltaSpeed = this.paddleSpeed * (delta / 1000);

    if (this.cursors.left.isDown) {
      const newX = (this.paddle.body as Phaser.Physics.Arcade.StaticBody).x - deltaSpeed;
      (this.paddle.body as Phaser.Physics.Arcade.StaticBody).x = Math.max(0, newX);
      this.paddle.setX(Math.max(50, this.paddle.x - deltaSpeed));
    }
    
    if (this.cursors.right.isDown) {
      const newX = (this.paddle.body as Phaser.Physics.Arcade.StaticBody).x + deltaSpeed;
      (this.paddle.body as Phaser.Physics.Arcade.StaticBody).x = Math.min(700, newX);
      this.paddle.setX(Math.min(750, this.paddle.x + deltaSpeed));
    }

    // Check if ball is below paddle
    if ((this.ball.body as Phaser.Physics.Arcade.Body).y > 600) {
      this.lives--;
      this.livesText.setText(`Lives: ${this.lives}`);
      
      if (this.lives <= 0) {
        this.scene.restart();
        this.score = 0;
        this.lives = 3;
      } else {
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        ballBody.x = 400;
        ballBody.y = 300;
        ballBody.setVelocity(200, -200);
      }
    }
  }

  private hitBrick(brick: Phaser.GameObjects.Rectangle) {
    brick.destroy();
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.bricks.every(brick => !brick.active)) {
      this.scene.restart();
      this.score = 0;
      this.lives = 3;
    }
  }
}