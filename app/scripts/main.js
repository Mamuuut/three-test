    'use strict';

    var container = $('.container');

    var camera, scene, renderer, controls;

    var innerWidth = container.width() - 10;
    var innerHeight = container.height() - 10;

    var aoPoint = [
      {value: 1, pos : [0, 0, 0]},
      {value: 1, pos : [2, 2, 0]},
      {value: 1, pos : [2, 2, 2]},
      {value: 1, pos : [2, 2, -2]},
      {value: 1, pos : [-2, 2, 0]},
      {value: 1, pos : [-2, 2, 2]},
      {value: 1, pos : [-2, 2, -2]},
      {value: 1, pos : [-2, -2, 0]},
      {value: 1, pos : [-2, -2, 2]},
      {value: 1, pos : [-2, -2, -2]},
      {value: 1, pos : [2, -2, 0]},
      {value: 1, pos : [2, -2, 2]},
      {value: 1, pos : [2, -2, -2]}
    ];

    function onWindowResize() {

        innerWidth = container.width() - 10;
        innerHeight = container.height() - 10;

        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( innerWidth, innerHeight);

        controls.handleResize();

        render();

    }

    function render() {

        renderer.render( scene, camera );
    }

    //

    function animate() {

      requestAnimationFrame( animate );
      controls.update();

      var fZMin = Infinity;
      var fZMax = -Infinity;

      aoPoint.forEach(function(oPoint, i)
      {
        var vector = new THREE.Vector3(oPoint.pos[0], oPoint.pos[1], oPoint.pos[2]);

        // map to normalized device coordinate (NDC) space
        vector.project( camera );

        oPoint.value = i;
        oPoint.vector = vector;
        fZMin = Math.min(fZMin, vector.z);
        fZMax = Math.max(fZMax, vector.z);
      });

      aoPoint.forEach(function(oPoint, i)
      {
        var fZRatio = (oPoint.vector.z - fZMin) / (fZMax - fZMin);
        var fScaleRatio = 1 - fZRatio / 2;
console.log(fScaleRatio);
        var fZIndex = Math.round(fScaleRatio * 100);
        var sScale = 
        oPoint.el.css({
          'left' : (oPoint.vector.x + 1) * innerWidth / 2 + 'px',
          'top' : (-oPoint.vector.y + 1) * innerHeight / 2 + 'px',
          'zIndex' : fZIndex,
          'opacity' : fScaleRatio,
          'transform' : 'scale(' + fScaleRatio + ')'
        }).html(oPoint.value);
      });

    }

    function init() {

      camera = new THREE.PerspectiveCamera( 45, innerWidth / innerHeight, 1, 2000 );
      camera.position.z = 50;

      controls = new THREE.TrackballControls( camera );

      controls.rotateSpeed = 2.0;
      controls.zoomSpeed = 2.0;
      controls.panSpeed = 0.8;

      controls.noZoom = false;
      controls.noPan = false;

      controls.staticMoving = true;
      controls.dynamicDampingFactor = 0.3;

      controls.keys = [ 65, 83, 68 ];

      controls.addEventListener( 'change', render );

      // scene

      scene = new THREE.Scene();

      var ambient = new THREE.AmbientLight( 0x444444 );
      scene.add( ambient );

      var directionalLight = new THREE.DirectionalLight( 0xffeedd );
      directionalLight.position.set( 0, 0, 1 ).normalize();
      scene.add( directionalLight );

      // BEGIN Clara.io JSON loader code
      var objectLoader = new THREE.ObjectLoader();
      objectLoader.load('model/teapot-claraio.json', function ( obj ) {
        scene.add( obj );
      } );
      // END Clara.io JSON loader code

      renderer = new THREE.WebGLRenderer();
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( innerWidth, innerHeight );
      container.append( renderer.domElement );

      aoPoint.forEach(function(oPoint)
      {
        var elPoint = $('<div class="point"></div>');
        oPoint.el = elPoint;
        container.append(elPoint);
      });

      window.addEventListener( 'resize', onWindowResize, false );

    }

    init();
    animate();


