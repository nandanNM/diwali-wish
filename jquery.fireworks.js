(function ($) {
  $.fn.fireworks = function (options) {
    var defaults = {
      sound: true,
      opacity: 0.9,
      width: "100%",
      height: "100%",
      duration: 10000, // 10 seconds duration
      mobileOptimized: true,
    };

    options = $.extend(defaults, options);

    var fireworksField = this;
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;

    // Mobile optimization - reduce particles for better performance
    var isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
    var MAX_PARTICLES = isMobile ? 100 : 280;

    var particles = [];
    var rockets = [];
    var audio;
    var animationStarted = false;
    var animationStopped = false;
    var startTime = 0;

    // Sound data - better firework sounds
    var sounds = [
      {
        prefix: "data:audio/wav;base64,",
        data: "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0hBjuE0vPTgjMGHm7A7+OZURE=",
      },
      {
        prefix: "data:audio/wav;base64,",
        data: "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0hBjuE0vPTgjMGHm7A7+OZURE=",
      },
      {
        prefix: "data:audio/wav;base64,",
        data: "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0hBjuE0vPTgjMGHm7A7+OZURE=",
      },
    ];

    if (options.sound) {
      audio = document.createElement("audio");
    }

    // create canvas and get the context
    var canvas = document.createElement("canvas");
    canvas.id = "fireworksField";
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.position = "fixed";
    canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.opacity = options.opacity;
    canvas.style.zIndex = "1000";
    canvas.style.pointerEvents = "none";

    // Mobile optimization
    if (isMobile) {
      canvas.style.maxWidth = "100vw";
      canvas.style.maxHeight = "100vh";
    }

    var context = canvas.getContext("2d");

    // The Particles Object
    function Particle(pos) {
      this.pos = {
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0,
      };
      this.vel = {
        x: 0,
        y: 0,
      };
      this.shrink = 0.97;
      this.size = 2;

      this.resistance = 1;
      this.gravity = 0;

      this.flick = false;

      this.alpha = 1;
      this.fade = 0;
      this.color = 0;
    }

    Particle.prototype.update = function () {
      // apply resistance
      this.vel.x *= this.resistance;
      this.vel.y *= this.resistance;

      // gravity down
      this.vel.y += this.gravity;

      // update position based on speed
      this.pos.x += this.vel.x;
      this.pos.y += this.vel.y;

      // shrink
      this.size *= this.shrink;

      // fade out
      this.alpha -= this.fade;
    };

    Particle.prototype.render = function (c) {
      if (!this.exists()) {
        return;
      }

      c.save();

      c.globalCompositeOperation = "lighter";

      var x = this.pos.x,
        y = this.pos.y,
        r = this.size / 2;

      var gradient = c.createRadialGradient(x, y, 0.1, x, y, r);
      gradient.addColorStop(0.1, "rgba(255,255,255," + this.alpha + ")");
      gradient.addColorStop(
        0.8,
        "hsla(" + this.color + ", 100%, 50%, " + this.alpha + ")"
      );
      gradient.addColorStop(1, "hsla(" + this.color + ", 100%, 50%, 0.1)");

      c.fillStyle = gradient;

      c.beginPath();
      c.arc(
        this.pos.x,
        this.pos.y,
        this.flick ? Math.random() * this.size : this.size,
        0,
        Math.PI * 2,
        true
      );
      c.closePath();
      c.fill();

      c.restore();
    };

    Particle.prototype.exists = function () {
      return this.alpha >= 0.1 && this.size >= 1;
    };

    // The Rocket Object
    function Rocket(x) {
      Particle.apply(this, [
        {
          x: x,
          y: SCREEN_HEIGHT,
        },
      ]);

      this.explosionColor = 0;
    }

    Rocket.prototype = new Particle();
    Rocket.prototype.constructor = Rocket;

    Rocket.prototype.explode = function () {
      if (options.sound) {
        var randomNumber = (function (min, max) {
          min = Math.ceil(min);
          max = Math.floor(max);
          return Math.floor(Math.random() * (max - min + 1)) + min;
        })(0, 2);
        try {
          audio.src = sounds[randomNumber].prefix + sounds[randomNumber].data;
          audio.volume = 0.3; // Lower volume for better UX
          audio.play().catch(function (e) {
            console.log("Audio play failed:", e);
          });
        } catch (e) {
          console.log("Audio error:", e);
        }
      }

      var count = Math.random() * 10 + 80;

      for (var i = 0; i < count; i++) {
        var particle = new Particle(this.pos);
        var angle = Math.random() * Math.PI * 2;

        // emulate 3D effect by using cosine and put more particles in the middle
        var speed = Math.cos((Math.random() * Math.PI) / 2) * 15;

        particle.vel.x = Math.cos(angle) * speed;
        particle.vel.y = Math.sin(angle) * speed;

        particle.size = 10;

        particle.gravity = 0.2;
        particle.resistance = 0.92;
        particle.shrink = Math.random() * 0.05 + 0.93;

        particle.flick = true;
        particle.color = this.explosionColor;

        particles.push(particle);
      }
    };

    Rocket.prototype.render = function (c) {
      if (!this.exists()) {
        return;
      }

      c.save();

      c.globalCompositeOperation = "lighter";

      var x = this.pos.x,
        y = this.pos.y,
        r = this.size / 2;

      var gradient = c.createRadialGradient(x, y, 0.1, x, y, r);
      gradient.addColorStop(0.1, "rgba(255, 255, 255 ," + this.alpha + ")");
      gradient.addColorStop(1, "rgba(0, 0, 0, " + this.alpha + ")");

      c.fillStyle = gradient;

      c.beginPath();
      c.arc(
        this.pos.x,
        this.pos.y,
        this.flick
          ? (Math.random() * this.size) / 2 + this.size / 2
          : this.size,
        0,
        Math.PI * 2,
        true
      );
      c.closePath();
      c.fill();

      c.restore();
    };

    var loop = function () {
      // update screen size
      if (SCREEN_WIDTH != window.innerWidth) {
        canvas.width = SCREEN_WIDTH = window.innerWidth;
      }
      if (SCREEN_HEIGHT != window.innerHeight) {
        canvas.height = SCREEN_HEIGHT = window.innerHeight;
      }

      // clear canvas
      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      var existingRockets = [];

      for (var i = 0; i < rockets.length; i++) {
        // update and render
        rockets[i].update();
        rockets[i].render(context);

        // calculate distance with Pythagoras
        var distance = Math.sqrt(
          Math.pow(SCREEN_WIDTH - rockets[i].pos.x, 2) +
            Math.pow(SCREEN_HEIGHT - rockets[i].pos.y, 2)
        );

        // random chance of 1% if rockets is above the middle
        var randomChance =
          rockets[i].pos.y < (SCREEN_HEIGHT * 2) / 3
            ? Math.random() * 100 <= 1
            : false;

        /* Explosion rules
                 - 80% of screen
                - going down
                - close to the mouse
                - 1% chance of random explosion
            */
        if (
          rockets[i].pos.y < SCREEN_HEIGHT / 5 ||
          rockets[i].vel.y >= 0 ||
          distance < 50 ||
          randomChance
        ) {
          rockets[i].explode();
        } else {
          existingRockets.push(rockets[i]);
        }
      }

      rockets = existingRockets;

      var existingParticles = [];

      for (i = 0; i < particles.length; i++) {
        particles[i].update();

        // render and save particles that can be rendered
        if (particles[i].exists()) {
          particles[i].render(context);
          existingParticles.push(particles[i]);
        }
      }

      // update array with existing particles - old particles should be garbage collected
      particles = existingParticles;

      while (particles.length > MAX_PARTICLES) {
        particles.shift();
      }
    };

    var launchFrom = function (x) {
      if (rockets.length < 10) {
        var rocket = new Rocket(x);
        rocket.explosionColor = Math.floor((Math.random() * 360) / 10) * 10;
        rocket.vel.y = Math.random() * -3 - 4;
        rocket.vel.x = Math.random() * 6 - 3;
        rocket.size = 8;
        rocket.shrink = 0.999;
        rocket.gravity = 0.01;
        rockets.push(rocket);
      }
    };

    var launch = function () {
      // Launch from multiple positions for better effect
      launchFrom(SCREEN_WIDTH * 0.2);
      setTimeout(function () {
        launchFrom(SCREEN_WIDTH * 0.5);
      }, 200);
      setTimeout(function () {
        launchFrom(SCREEN_WIDTH * 0.8);
      }, 400);
    };

    // Animation control variables
    var animationId;
    var lastTime = 0;
    var launchTimer = 0;
    var scrollDetected = false;

    function animate(currentTime) {
      // Stop animation if scroll detected or duration exceeded
      if (scrollDetected || currentTime - startTime > options.duration) {
        stopAnimation();
        return;
      }

      var deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Launch fireworks every 800ms
      launchTimer += deltaTime;
      if (launchTimer >= 800) {
        launch();
        launchTimer = 0;
      }

      // Update animation loop
      loop();

      // Continue animation
      animationId = requestAnimationFrame(animate);
    }

    function stopAnimation() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (launchInterval) {
        clearInterval(launchInterval);
        launchInterval = null;
      }
      // Hide canvas
      canvas.style.display = "none";
      animationStopped = true;
    }

    function startAnimation() {
      if (animationStopped || animationStarted) return;

      animationStarted = true;
      startTime = performance.now();
      lastTime = startTime;

      // Show canvas
      canvas.style.display = "block";

      // Start the animation loop
      animationId = requestAnimationFrame(animate);

      // Start launch interval
      launchInterval = setInterval(function () {
        if (!scrollDetected && !animationStopped) {
          launch();
        }
      }, 800);
    }

    // Scroll detection
    var scrollTimeout;
    $(window).on("scroll", function () {
      if (!scrollDetected) {
        scrollDetected = true;
        stopAnimation();
      }
    });

    // Touch detection for mobile
    if (isMobile) {
      $(window).on("touchmove", function () {
        if (!scrollDetected) {
          scrollDetected = true;
          stopAnimation();
        }
      });
    }

    // Append the canvas and start the animation
    $(fireworksField).append(canvas);

    // Start animation after a short delay
    setTimeout(startAnimation, 500);

    return fireworksField;
  };
})(jQuery);
