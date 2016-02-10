    'use strict';

    var container = $('.container');

    var camera, scene, renderer, controls;

    var innerWidth = container.width() - 10;
    var innerHeight = container.height() - 10;

    var aoPoint = [
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

      // scene

      scene = new THREE.Scene();

      var ambient = new THREE.AmbientLight( 0x444444 );
      scene.add( ambient );

      // BEGIN Clara.io JSON loader code
      // var objectLoader = new THREE.ObjectLoader();

      // objectLoader.load('model/teapot-claraio.json', function ( obj ) {
      //   scene.add( obj );
      // } );

      var loader = new THREE.OBJLoader();

      loader.load('model/converted.obj', function ( obj ) {
        var mesh = obj;
        var material = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.FlatShading } );
        // var material = new THREE.MeshBasicMaterial( { color: 0xffaa00, wireframe: true } );
        // var material = new THREE.MeshDepthMaterial();

        mesh.children[0].material = material;
        scene.add( mesh );

        var bbox = new THREE.BoundingBoxHelper( mesh, 0x00ff00 );
        bbox.update();
        scene.add( bbox );

        aoPoint.push({value: 1, pos : [bbox.box.min.x, bbox.box.min.y, bbox.box.min.z]});
        aoPoint.push({value: 1, pos : [bbox.box.max.x, bbox.box.min.y, bbox.box.min.z]});
        aoPoint.push({value: 1, pos : [bbox.box.min.x, bbox.box.max.y, bbox.box.min.z]});
        aoPoint.push({value: 1, pos : [bbox.box.min.x, bbox.box.min.y, bbox.box.max.z]});

        aoPoint.push({value: 1, pos : [bbox.box.max.x, bbox.box.max.y, bbox.box.max.z]});
        aoPoint.push({value: 1, pos : [bbox.box.max.x, bbox.box.max.y, bbox.box.min.z]});
        aoPoint.push({value: 1, pos : [bbox.box.max.x, bbox.box.min.y, bbox.box.max.z]});
        aoPoint.push({value: 1, pos : [bbox.box.min.x, bbox.box.max.y, bbox.box.max.z]});

        camera = new THREE.PerspectiveCamera( 45, innerWidth / innerHeight, 1, 200000 );

        camera.position.z = 20000;
        camera.up = new THREE.Vector3(1,1,1);
        camera.updateProjectionMatrix();

        controls = new THREE.TrackballControls( camera );

        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 2.0;
        controls.panSpeed = 0.8;

        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        controls.keys = [ 65, 83, 68 ];

        controls.target.set(
          bbox.box.min.x + (bbox.box.max.x - bbox.box.min.x) / 2,
          bbox.box.min.y + (bbox.box.max.y - bbox.box.min.y) / 2,
          bbox.box.min.z + (bbox.box.max.z - bbox.box.min.z) / 2
        );

        var directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( 0, 1, 1 ).normalize();
        directionalLight.target.position.set(
          bbox.box.min.x + (bbox.box.max.x - bbox.box.min.x) / 2,
          bbox.box.min.y + (bbox.box.max.y - bbox.box.min.y) / 2,
          bbox.box.min.z + (bbox.box.max.z - bbox.box.min.z) / 2
        );
        scene.add( directionalLight );

        controls.addEventListener( 'change', render );


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

        animate();
      } );

    }

    init();

