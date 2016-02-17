    'use strict';

    var container = $('.container');

    var camera, scene, renderer, controls;
    var SHADOW_MAP_WIDTH = 2048,
        SHADOW_MAP_HEIGHT = 1024;

    var innerWidth = container.width() - 10;
    var innerHeight = container.height() - 10;

    var aoPoint = [];

    function onWindowResize() {

        innerWidth = container.width() - 10;
        innerHeight = container.height() - 10;

        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(innerWidth, innerHeight);

        controls.handleResize();

        render();

    }

    function render() {

        renderer.render(scene, camera);
    }

    //

    function animate() {

        requestAnimationFrame(animate);
        controls.update();

        var fZMin = Infinity;
        var fZMax = -Infinity;

        aoPoint.forEach(function(oPoint, i) {
            var vector = new THREE.Vector3(oPoint.pos[0], oPoint.pos[1], oPoint.pos[2]);

            // map to normalized device coordinate (NDC) space
            vector.project(camera);

            oPoint.value = i;
            oPoint.vector = vector;
            fZMin = Math.min(fZMin, vector.z);
            fZMax = Math.max(fZMax, vector.z);
        });

        aoPoint.forEach(function(oPoint, i) {
            var fZRatio = (oPoint.vector.z - fZMin) / (fZMax - fZMin);
            var fScaleRatio = 1 - fZRatio / 2;

            var fZIndex = Math.round(fScaleRatio * 100);
            var sScale =

                oPoint.el.css({
                    'left'      : (oPoint.vector.x + 1) * innerWidth / 2 + 'px',
                    'top'       : (-oPoint.vector.y + 1) * innerHeight / 2 + 'px',
                    'zIndex'    : fZIndex,
                    'opacity'   : fScaleRatio,
                    'transform' : 'scale(' + fScaleRatio + ')'
                }).html(oPoint.value);
        });

    }

    function addPointLight(scene, x, y, z) {
        var light = new THREE.PointLight(0xffffff, 0.4, 1000);
        light.position.set(x, y, z);

        light.castShadow = true;

        light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
        light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

        scene.add(light);
    }

    function addControl(oCenter) {
        controls = new THREE.TrackballControls(camera);

        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 2.0;
        controls.panSpeed = 0.8;

        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        controls.keys = [65, 83, 68];

        controls.target.set(oCenter.x, oCenter.y, oCenter.z);
        controls.addEventListener('change', render);
    }


    function init() {

        // scene

        scene = new THREE.Scene();

        // var ambient = new THREE.AmbientLight(0x444444);
        // scene.add(ambient);

        var loader = new THREE.OBJLoader();

        loader.load('model/converted.obj', function(obj) {
            // Mesh
            var mesh = obj;
            mesh.scale.x = mesh.scale.y = mesh.scale.z = 0.01;
            var material = new THREE.MeshPhongMaterial({
                color     : 0xdddddd,
                specular  : 0x448800,
                shininess : 30,
                shading   : THREE.FlatShading
            });

            mesh.children[0].material = material;
            mesh.children[0].castShadow = true;
            mesh.children[0].receiveShadow = true;
            scene.add(mesh);

            // Bounding Box
            var bbox = new THREE.BoundingBoxHelper(mesh, 0x00ff00);
            bbox.update();
            // scene.add(bbox);

            // Camera
            camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 2000);

            camera.position.z = 250;
            camera.up = new THREE.Vector3(1, 1, 1);
            camera.updateProjectionMatrix();

            // Light
            addPointLight(scene, bbox.box.max.x, bbox.box.max.y, bbox.box.max.z * 2);
            addPointLight(scene, bbox.box.min.x, bbox.box.min.y, bbox.box.max.z * 2);
            addPointLight(scene, bbox.box.center().x, bbox.box.center().y, bbox.box.max.z * 2);
            addPointLight(scene, bbox.box.min.x, bbox.box.max.y, bbox.box.max.z * 2);
            addPointLight(scene, bbox.box.max.x, bbox.box.min.y, bbox.box.max.z * 2);

            // Control
            addControl(bbox.box.center());

            // Renderer
            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(innerWidth, innerHeight);
            renderer.setClearColor('#333333');
            container.append(renderer.domElement);

            // renderer.shadowMap.enabled = true;
            // renderer.shadowMap.type = THREE.PCFShadowMap;

            // List of Value Points
            aoPoint.push({
                value: 1,
                pos: [bbox.box.min.x, bbox.box.min.y, bbox.box.min.z]
            });
            aoPoint.push({
                value: 1,
                pos: [bbox.box.max.x, bbox.box.min.y, bbox.box.min.z]
            });
            aoPoint.push({
                value: 1,
                pos: [bbox.box.min.x, bbox.box.max.y, bbox.box.min.z]
            });
            aoPoint.push({
                value: 1,
                pos: [bbox.box.min.x, bbox.box.min.y, bbox.box.max.z]
            });

            aoPoint.push({
                value: 1,
                pos: [bbox.box.max.x, bbox.box.max.y, bbox.box.max.z]
            });
            aoPoint.push({
                value: 1,
                pos: [bbox.box.max.x, bbox.box.max.y, bbox.box.min.z]
            });
            aoPoint.push({
                value: 1,
                pos: [bbox.box.max.x, bbox.box.min.y, bbox.box.max.z]
            });
            aoPoint.push({
                value: 1,
                pos: [bbox.box.min.x, bbox.box.max.y, bbox.box.max.z]
            });

            aoPoint.forEach(function(oPoint) {
                var elPoint = $('<div class="point"></div>');
                oPoint.el = elPoint;
                container.append(elPoint);

                var geometry = new THREE.SphereGeometry( 2, 16, 16 );
                var material = new THREE.MeshBasicMaterial({ color : 0x88ff00 });
                var sphere = new THREE.Mesh( geometry, material );
                sphere.position.set( oPoint.pos[0], oPoint.pos[1], oPoint.pos[2] );
                scene.add( sphere );
            });

            window.addEventListener('resize', onWindowResize, false);

            controls.update();
            render();
            animate();
        });

    }

    init();