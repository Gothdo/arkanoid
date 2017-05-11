const loadFonts = function() {
  return new Promise((resolve, reject) => {
    WebFont.load({
      active: resolve,
      google: { families: ['Play:400,700:latin-ext'] },
    });
  });
};

const addText = function(context, x, y, content, options) {
  const text = context.add.text(x, y, content, {
    font: 'Play',
    align: 'center',
    fill: '#d7dbdd',
    ...options,
  });
  text.anchor.setTo(0.5, 0.5);
  return text;
};

const SCORE_PER_BRICK = 10;

class Intro extends Phaser.State {
  init() {
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.stage.backgroundColor = '#17202a';
  }
  create() {
    const introText = addText(this, 400, 200, 'Michał Perłakowski presents', { fontSize: 40, fill: '#ffffff' });
    introText.alpha = 0;
    const firstTween = this.add.tween(introText).to({ alpha: 1 }, 2500, Phaser.Easing.Quartic.In, true);
    const secondTween = this.add.tween(introText).to({ alpha: 0 }, 1500, Phaser.Easing.Quartic.Out, false, 2000);
    firstTween.chain(secondTween);
    secondTween.onComplete.add(() => this.state.start('menu'));
  }
}

class Menu extends Phaser.State {
  init() {
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.stage.backgroundColor = '#17202a';
    this.activeElementId = 0;
  }
  switch(amount) {
    this.add.tween(R.nth(this.activeElementId, this.elements)).to({ alpha: 1 }, 150, null, true);
    this.activeElementId = (this.activeElementId + amount) % this.elements.length;
    this.add.tween(R.nth(this.activeElementId, this.elements)).to({ alpha: 0.5 }, 150, null, true);
  }
  onEnter() {
    switch (this.activeElementId) {
      case 0:
        this.state.start('game');
        break;
      case 1:
        break;
    }
  }
  create() {
    this.add.tween(
      addText(this, 400, -50, 'Arkanoid', { fontSize: 120 }),
    ).to({ y: 100 }, 1500, Phaser.Easing.Quartic.Out, true);
    this.elements = ['Play', 'High Scores'].map((x, i) => addText(this, -200, 250 + 100 * i, x, { fontSize: 60 }));
    this.elements.reduce((acc, x, i) =>
      this.add.tween(x).to({ x: 400 }, 750, Phaser.Easing.Quartic.Out, true, 1000 + 500 * i),
      null,
    );
    this.elements[0].alpha = 0.5;
    this.input.keyboard.addKey(Phaser.Keyboard.UP).onDown.add(() => this.switch(-1), this);
    this.input.keyboard.addKey(Phaser.Keyboard.DOWN).onDown.add(() => this.switch(1), this);
    this.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(this.onEnter, this);
  }
}

class Game extends Phaser.State {
  init() {
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.stage.backgroundColor = '#17202a';
    this.physics.startSystem(Phaser.Physics.ARCADE);
  }
  createBrick(x, y, width, height, color = 0xd7dbdd) {
    return this.add.graphics(x, y).beginFill(color).drawRect(0, 0, width, height).endFill();
  }
  softReset() {
    [this.ball.x, this.ball.y] = [400, 400];
    this.physics.arcade.velocityFromAngle(70, 300, this.ball.body.velocity);
  }
  create() {
    this.score = 0;
    this.extraLives = 3;

    this.ball = this.add.graphics(400, 400);
    this.ball.beginFill(0xd7dbdd).drawRect(0, 0, 10, 10).endFill();
    this.physics.enable(this.ball, Phaser.Physics.ARCADE);
    this.ball.body.collideWorldBounds = true;
    this.ball.body.bounce.setTo(1, 1);
    this.physics.arcade.velocityFromAngle(70, 300, this.ball.body.velocity);
    this.ball.body.onWorldBounds = new Phaser.Signal();
    this.ball.body.onWorldBounds.add((ball, _, down) => {
      if (down) {
        if (--this.extraLives >= 0) {
          this.softReset();
        } else {
          this.state.start('game over');
        }
      }
    });

    this.paddle = this.add.graphics(400, 550);
    this.paddle.beginFill(0xd7dbdd).drawRect(0, 0, 150, 10).endFill();
    this.physics.enable(this.paddle, Phaser.Physics.ARCADE);
    this.paddle.body.collideWorldBounds = true;
    this.paddle.body.immovable = true;

    const bricksColors = [0x922b21, 0x1a237e, 0x1b5e20, 0x873600];
    this.bricks = this.add.group();
    R.times(i =>
      R.times(j =>
        this.bricks.add(this.createBrick(20 + i * 77, 80 + j * 30, 67, 20, bricksColors[j])),
        4,
      ),
      10,
    );
    this.physics.enable(this.bricks, Phaser.Physics.ARCADE);
    this.bricks.setAll('body.immovable', true);
    this.bricks.callAll('events.onKilled.add', 'events.onKilled', brick => {
      this.score += SCORE_PER_BRICK;
      brick.visible = true;
      this.add.tween(brick)
        .to({
          x: brick.centerX,
          y: brick.centerY,
          width: 0,
          height: 0,
          alpha: 0,
        }, 800, Phaser.Easing.Quartic.Out, true)
        .onComplete.add(() => brick.destroy());
    });

    this.topBar = this.add.graphics(0, 0);
    this.topBar.beginFill(0x273746).drawRect(0, 0, 800, 60).endFill();
    this.physics.enable(this.topBar, Phaser.Physics.ARCADE);
    this.topBar.body.immovable = true;

    this.scoreText = addText(this, 20, 35, this.score, { fontSize: 50 });
    [this.scoreText.anchor.x, this.scoreText.anchor.y] = [0, 0.5];
  }
  update() {
    this.physics.arcade.collide(this.ball, this.topBar);
    this.physics.arcade.collide(this.ball, this.paddle, () => {
      if (this.paddle.body.touching.up) {
        const distanceFromCenter = this.ball.centerX - this.paddle.centerX;
        const relativeDistance = distanceFromCenter / (this.paddle.width / 2);
        const upDirection = -90;
        this.physics.arcade.velocityFromAngle(upDirection + relativeDistance * 45, this.ball.body.speed, this.ball.body.velocity);
      }
    });
    this.bricks.forEach(brick => this.physics.arcade.collide(brick, this.ball, R.invoker(0, 'kill')));
    if (this.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
      this.paddle.body.velocity.x = -300;
    } else if (this.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
      this.paddle.body.velocity.x = 300;
    } else {
      this.paddle.body.velocity.x = 0;
    }
    this.scoreText.text = this.score;
  }
}

class GameOver extends Phaser.State {
  init() {
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.stage.backgroundColor = '#17202a';
  }
  create() {
    addText(this, 400, 100, 'Game Over', { fontSize: 80 });
  }
}

loadFonts().then(() => {
  const game = new Phaser.Game(800, 600, Phaser.AUTO, '');
  game.state.add('intro', Intro, true);
  game.state.add('menu', Menu);
  game.state.add('game', Game, true);
  game.state.add('game over', GameOver);
});
