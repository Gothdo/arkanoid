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
  create() {
    this.ball = this.add.graphics(400, 400);
    this.ball.beginFill(0xd7dbdd);
    this.ball.drawRect(0, 0, 10, 10);
    this.ball.endFill();
    this.physics.enable(this.ball, Phaser.Physics.ARCADE);
    this.ball.body.collideWorldBounds = true;
    this.ball.body.bounce.setTo(1, 1);
    this.physics.arcade.velocityFromAngle(70, 300, this.ball.body.velocity);

    this.paddle = this.add.graphics(400, 550);
    this.paddle.beginFill(0xd7dbdd);
    this.paddle.drawRect(0, 0, 150, 10);
    this.paddle.endFill();
    this.physics.enable(this.paddle, Phaser.Physics.ARCADE);
    this.paddle.body.collideWorldBounds = true;
    this.paddle.body.immovable = true;
  }
  update() {
    this.physics.arcade.collide(this.ball, this.paddle, () => {
      if (this.paddle.body.touching.up) {
        const distanceFromCenter = this.ball.centerX - this.paddle.centerX;
        const relativeDistance = distanceFromCenter / (this.paddle.width / 2);
        const upDirection = -90;
        this.physics.arcade.velocityFromAngle(upDirection + relativeDistance * 45, this.ball.body.speed, this.ball.body.velocity);
      }
    });
    if (this.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
      this.paddle.body.velocity.x = -300;
    } else if (this.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
      this.paddle.body.velocity.x = 300;
    } else {
      this.paddle.body.velocity.x = 0;
    }
  }
}

loadFonts().then(() => {
  const game = new Phaser.Game(800, 600, Phaser.AUTO, '');
  game.state.add('intro', Intro, true);
  game.state.add('menu', Menu);
  game.state.add('game', Game, true);
});
