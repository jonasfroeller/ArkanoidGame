import Phaser from 'phaser';

interface LevelConfig {
  pattern: number[][];
  colors: { [key: number]: number };
}

export class MainScene extends Phaser.Scene {
  private paddle!: Phaser.GameObjects.Rectangle;
  private ball!: Phaser.GameObjects.Arc;
  private bricks!: Phaser.GameObjects.Rectangle[];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private score: number = 0;
  private lives: number = 3;
  private level: number = 1;
  private paddleSpeed: number = 400;

  private readonly BRICK_WIDTH = 80;
  private readonly BRICK_HEIGHT = 30;
  private readonly BRICK_PADDING = 10;

  private levelConfigs: LevelConfig[] = [
    {
      pattern: [
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0],
      ],
      colors: {
        1: 0x0000ff,
      }
    },
    {
      pattern: [
        [1, 0, 2, 0, 1],
        [1, 2, 2, 2, 1],
        [1, 1, 1, 1, 1],
      ],
      colors: {
        1: 0x00ff00,
        2: 0x00ffff,
      }
    },
    {
      pattern: [
        [1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 1],
        [1, 2, 3, 3, 2, 1],
        [1, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 1],
      ],
      colors: {
        1: 0xff0000,
        2: 0xff7700,
        3: 0xffff00,
      }
    },
    {
      pattern: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 1],
        [1, 2, 3, 3, 3, 2, 1],
        [1, 2, 3, 4, 3, 2, 1],
        [1, 2, 3, 3, 3, 2, 1],
        [1, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 1, 1],
      ],
      colors: {
        1: 0xff00ff,
        2: 0xff0077,
        3: 0x7700ff,
        4: 0xffffff,
      }
    }
  ];

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    this.createGameObjects();
    this.showLevelIntro();
  }

  private handlePaddleCollision(ball: Phaser.GameObjects.Arc, paddle: Phaser.GameObjects.Rectangle) {
    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    const speed = 300;

    // Determine if this is a side collision or top collision
    const ballCenterY = ball.y;
    const paddleTop = paddle.y - paddle.height / 2;
    const isSideCollision = ballCenterY > paddleTop + 5;

    if (isSideCollision) {
      ballBody.setVelocityX(-ballBody.velocity.x);
      return;
    }

    // For top collisions, calculate angle based on hit position
    const hitPosition = (ball.x - paddle.x) / (paddle.width / 2);
    const maxBounceAngle = 60;

    const normalizedHit = Math.sin(hitPosition * Math.PI / 2);
    const angle = normalizedHit * maxBounceAngle;

    const angleRad = Phaser.Math.DegToRad(90 - angle);
    let velocityX = -speed * Math.cos(angleRad);
    let velocityY = -speed * Math.sin(angleRad);

    const minVerticalVelocity = speed * 0.4;
    velocityY = Math.min(velocityY, -minVerticalVelocity);

    velocityX += Phaser.Math.Between(-20, 20);

    ballBody.setVelocity(velocityX, velocityY);
  }

  private createGameObjects() {
    this.paddle = this.add.rectangle(400, 550, 100, 20, 0x00ff00);
    this.physics.add.existing(this.paddle, true);

    this.ball = this.add.circle(400, 300, 10, 0xff0000);
    this.physics.add.existing(this.ball);
    (this.ball.body as Phaser.Physics.Arcade.Body).setBounce(1, 1);
    (this.ball.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(false);

    const leftWall = this.add.rectangle(-10, 300, 20, 600);
    const rightWall = this.add.rectangle(810, 300, 20, 600);
    const topWall = this.add.rectangle(400, -10, 800, 20);

    this.physics.add.existing(leftWall, true);
    this.physics.add.existing(rightWall, true);
    this.physics.add.existing(topWall, true);

    this.physics.add.collider(this.ball, leftWall);
    this.physics.add.collider(this.ball, rightWall);
    this.physics.add.collider(this.ball, topWall);

    this.createBricks();

    this.physics.add.collider(
      this.ball,
      this.paddle,
      () => this.handlePaddleCollision(this.ball, this.paddle),
      undefined,
      this
    );

    this.bricks.forEach(brick => {
      this.physics.add.collider(this.ball, brick, () => this.hitBrick(brick), undefined, this);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();

    if (!this.scoreText) {
      this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', color: '#ffffff' });
    }
    if (!this.livesText) {
      this.livesText = this.add.text(this.sys.game.config.width as number - 16, 16, 'Lives: 3', { fontSize: '32px', color: '#ffffff' }).setOrigin(1, 0);
    }
    if (!this.levelText) {
      this.levelText = this.add.text(400, 16, `Level ${this.level}`, { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5, 0);
    }
  }

  private createBricks() {
    this.bricks = [];
    const config = this.levelConfigs[(this.level - 1) % this.levelConfigs.length];
    const pattern = config.pattern;

    const totalWidth = pattern[0].length * (this.BRICK_WIDTH + this.BRICK_PADDING);
    const startX = (800 - totalWidth) / 2 + this.BRICK_WIDTH / 2;
    const startY = 60;

    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        const brickType = pattern[row][col];
        if (brickType === 0) continue;

        const brick = this.add.rectangle(
          startX + col * (this.BRICK_WIDTH + this.BRICK_PADDING),
          startY + row * (this.BRICK_HEIGHT + this.BRICK_PADDING),
          this.BRICK_WIDTH,
          this.BRICK_HEIGHT,
          config.colors[brickType]
        );
        this.physics.add.existing(brick, true);
        this.bricks.push(brick);
      }
    }
  }

  private showLevelIntro() {
    const introText = this.add.text(400, 300, `Level ${this.level}\nGet Ready!`, {
      fontSize: '48px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.ball.setPosition(this.paddle.x, this.paddle.y - 20);
    (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    this.time.delayedCall(2000, () => {
      introText.destroy();
      this.launchBall();
    });
  }

  private launchBall() {
    const speed = 300;
    const angle = Phaser.Math.Between(210, 330);
    const velocity = this.physics.velocityFromAngle(angle, speed);
    (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(velocity.x, velocity.y);
  }

  update(_time: number, delta: number) {
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

    if (this.lives > 0 && (this.ball.body as Phaser.Physics.Arcade.Body).y > this.paddle.y + 50) {
      this.lives--;
      this.livesText.setText(`Lives: ${this.lives}`);

      if (this.lives <= 0) {
        this.handleGameOver();
      } else {
        this.resetBall();
      }
    }
  }

  private handleGameOver() {
    // Disable all game physics
    (this.ball.body as Phaser.Physics.Arcade.Body).enable = false;
    (this.paddle.body as Phaser.Physics.Arcade.StaticBody).enable = false;

    const gameOverText = this.add.text(400, 300, 'Game Over!\nRestarting...', {
      fontSize: '48px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: gameOverText,
      alpha: { from: 1, to: 0 },
      duration: 1500,
      ease: 'Power2',
      delay: 1000,
      onComplete: () => {
        this.cleanupScene();
        this.scene.restart();
      }
    });
  }

  private cleanupScene() {
    // Destroy all game objects
    this.ball.destroy();
    this.paddle.destroy();
    this.bricks.forEach(brick => brick.destroy());

    // Clear all physics
    this.physics.world.colliders.destroy();
    this.physics.world.bodies.clear();

    // Destroy UI elements
    this.scoreText.destroy();
    this.livesText.destroy();
    this.levelText.destroy();

    // Clear references
    this.bricks = [];
    this.scoreText = undefined as any;
    this.livesText = undefined as any;
    this.levelText = undefined as any;
  }

  private resetBall() {
    this.ball.setPosition(this.paddle.x, this.paddle.y - 20);
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setVelocity(0, 0);

    this.time.delayedCall(1000, () => {
      this.launchBall();
    });
  }

  private hitBrick(brick: Phaser.GameObjects.Rectangle) {
    brick.destroy();
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.bricks.every(brick => !brick.active)) {
      this.level++;
      this.levelText.setText(`Level ${this.level}`);

      // Clear existing bricks array
      this.bricks.forEach(brick => {
        if (brick.body) {
          brick.destroy();
        }
      });
      this.bricks = [];

      // Create new bricks and set up their colliders
      this.createBricks();
      this.bricks.forEach(brick => {
        this.physics.add.collider(this.ball, brick, () => this.hitBrick(brick), undefined, this);
      });

      this.showLevelIntro();
    }
  }
}