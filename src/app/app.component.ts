import { Component } from '@angular/core';

import { Http, Response } from '@angular/http';

declare var GL;
declare var vec3;
declare var mat4;
declare var DEG2RAD;
declare var Raytracer, BBox, Shader;
declare var THREE;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';

  data: any;

  constructor(private http: Http) {
	  this.getJsonFile("./assets/data.json");
  }

  getJsonFile(urlJson: string) {
	this.http.get(urlJson)
		.subscribe(
			data => this.data = data.json(),
			err => this.handleError,
			() => { this.init(this.data);}
		);
  }

  private handleError(error: any): Promise<any> {
	console.error('An error occurred', error); // for demo purposes only
	return Promise.reject(error.message || error);
  }

  init(data:any) {

		//create the rendering context
		var container = document.body;

		var gl = GL.create({width: container.offsetWidth, height: container.offsetHeight});
		container.appendChild(gl.canvas);
		gl.animate();

		//build the mesh
		var cube_mesh = GL.Mesh.cube({size:5});
		var cam_pos = vec3.fromValues(200,200,200);
		var look_to = vec3.fromValues(0,0,0);

		var cam_pos_anterior;
		var look_to_anterior;

		var primeraVegada = true;

		var geometry = new THREE.BoxGeometry( 1, 1, 1 );
		var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		var cube = new THREE.Mesh( geometry, material );

		//create basic matrices for cameras and transformation
		var projection = /*window.persp = */mat4.create();
		var view = /*window.view = */mat4.create();
		var mvp = /*window.mvp = */mat4.create();
		var temp = mat4.create();
		var modelAxes = mat4.create();

		var objects: any[] = [];

		var ratoli: any;

		var sinusNegatiu = false;
		var sinusPositiu = false;

		var moveInX = true;
		var moveInY = false;
		var moveInZ = false;
		var movePositive = true;

		var doMove = false;

		var dVar = 1;

		var actualNumber;
		var lastNumber;

		var puntuacio = 0;

		//print axes x,y,z
		var axes = GL.Mesh.load({ vertices: [0,0,0, 0,100,0,  0,0,0, 100,0,0,  0,0,0, 0,0,100,], 
								colors: [1,0,0,1, 1,0,0,1,  1,1,1,1, 1,1,1,1,  0,0,1,1, 0,0,1,1 ] });
/*
		var planes = GL.Mesh.load({ vertices: [0,0,0, 100,100,0, 0,100,0, 0,0,0, 100,0,0, 100,100,0,
										0,0,0, 0,0,100, 100,0,100, 0,0,0, 100,0,100, 100,0,0,
										0,0,0, 0,100,100, 0,0,100, 0,0,0, 0,100,0, 0,100,100,
										0,0,100, 100,100,100, 0,100,100, 0,0,100, 100,0,100, 100,100,100,
										0,100,0, 0,100,100, 100,100,100, 0,100,0, 100,100,100, 100,100,0,
										100,0,0, 100,100,100, 100,0,100, 100,0,0, 100,100,0, 100,100,100], 
								colors: [1,0,0,0.5, 1,0,0,0.5,  1,0,0,0.5, 1,0,0,0.5, 1,0,0,0.5,  1,0,0,0.5,
										0,1,0,0.5, 0,1,0,0.5,  0,1,0,0.5, 0,1,0,0.5, 0,1,0,0.5,  0,1,0,0.5,
										0,0,1,0.5, 0,0,1,0.5,  0,0,1,0.5, 0,0,1,0.5, 0,0,1,0.5,  0,0,1,0.5,
										1,0,0,0.5, 1,0,0,0.5,  1,0,0,0.5, 1,0,0,0.5, 1,0,0,0.5,  1,0,0,0.5,
										0,1,0,0.5, 0,1,0,0.5,  0,1,0,0.5, 0,1,0,0.5, 0,1,0,0.5,  0,1,0,0.5,
										0,0,1,0.5, 0,0,1,0.5,  0,0,1,0.5, 0,0,1,0.5, 0,0,1,0.5,  0,0,1,0.5] });
*/
		lecturaObjectesDelFitxerJson();

		creacioRatoli();

		var texture = GL.Texture.cubemapFromURL("assets/cross-skybox.jpg",{temp_color:[80,120,40,255], is_cross: 1, minFilter: gl.LINEAR_MIPMAP_LINEAR });
		
/*
		for(var x = -10; x <= 10; x++)
			for(var y = -5; y <= 5; y++)
				objects.push({ color: [0.3,0.3,0.3,1.0], model: mat4.translationMatrix( [x*12,y*12,0] ), mesh: cube_mesh });
*/
		//set the camera perspective
		mat4.perspective( projection, 45 * DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
		//mat4.ortho(persp, -50,50,-50,50,0,500); //ray doesnt work in perspective

		function colisioAmbRatoli(model) {

			if(model[12] == ratoli.model[12]
			&& model[13] == ratoli.model[13]
			&& model[14] == ratoli.model[14]) {
				incrementarPuntuacio();
				recalcularPosicioRatoli();
			}
			
		}

		function incrementarPuntuacio() {

			puntuacio ++;

		}

		function recalcularPosicioRatoli() {

			var limitSuperior = 20*6;
			var limitInferior = 0*6;
			ratoli.model[12] = Math.floor((Math.random() * limitSuperior) + limitInferior);
			ratoli.model[13] = Math.floor((Math.random() * limitSuperior) + limitInferior);
			ratoli.model[14] = Math.floor((Math.random() * limitSuperior) + limitInferior);

		}

		function lecturaObjectesDelFitxerJson() {

			for(var i = 0; i < data.length; i++) {
				var o = data[i];
				objects.push({ color: [o.colorR,o.colorG,o.colorB,o.colorAlpha], model: mat4.translationMatrix( [o.posX*6,o.posY*6,o.posZ*6] ), mesh: cube_mesh, translate: false, axe: "X" });
			}

		}

		function creacioRatoli() {

			var meshRatoli = GL.Mesh.sphere({size:10});

			ratoli = { color: [1,0,0,1], model: mat4.translationMatrix( [0,0,0] ), mesh: meshRatoli };

			recalcularPosicioRatoli();

		}

		function getClosestObject(x,y) {

			mat4.multiply( mvp, projection, view );
			var RT = new GL.Raytracer( mvp );
			var ray = RT.getRayForPixel(x,y);

			var closest_object = null;
			var closest_t = 100000000;

			for(var i in objects) {

				var object = objects[i];

				var result = Raytracer.hitTestBox( cam_pos, ray, BBox.getMin(object.mesh.bounding), BBox.getMax(object.mesh.bounding), object.model );
				if(result && closest_t > result.t) {

					closest_object = object;
					closest_t = result.t;
				}
			}
			return closest_object;
		}

		gl.captureMouse();
		gl.onmousemove = function(e) {
			var dz = 50;
			var object = getClosestObject(e.canvasx, gl.canvas.height - e.canvasy);
			
			if(e.dragging) {
				mat4.rotateY(modelAxes,modelAxes,e.deltax * 0.01);
				cam_pos[1] += e.deltay;
			}
		}
		gl.onmousedown = function(e) {
			if(gl.mouse.left_button) {
				var dz = 50;

				var object = getClosestObject(e.canvasx, gl.canvas.height - e.canvasy);
				if(object) {
					//console.log(object.model);
					object.model = mat4.translationMatrix( [object.model[12],object.model[13],object.model[14] + dz] );
					//console.log(object.model);
					cam_pos[0] = object.model[12];
					cam_pos[1] = object.model[13];
					cam_pos[2] = object.model[14] + dz;
				}
			} else if(gl.mouse.right_button) {
				var dx = 5;
				var dy = 0;
				var dz = 0;
				cam_pos[0] = cam_pos[0] + dx;
				cam_pos[1] = cam_pos[1] + dy;
				cam_pos[2] = cam_pos[2] + dz;
				console.log("right");
			}
		}
		gl.captureKeys();
		gl.onkey = function(e) {
			console.log("key"+e.keyCode);
			var code = e.keyCode;
			var type = e.type;
			if(type == "keydown") {
				if(code == "37") {
					doMove = true;
					primeraVegada = true;
					if(moveInX) {
						changeXYZ(false, false, true);
						movePositive = !movePositive;
					}else if(moveInY) {
						changeXYZ(true, false, false);
						movePositive = !movePositive;
					} else if(moveInZ) {
						changeXYZ(true, false, false);
						movePositive = movePositive;
					}
				} else if(code == 38) {
					doMove = true;
					if(moveInX) {
						changeXYZ(false, true, false);
						movePositive = true;
					}else if(moveInY) {
						changeXYZ(false, false, true);
						movePositive = !movePositive;
					} else if(moveInZ) {
						changeXYZ(false, true, false);
						movePositive = true;
					}
				} else if(code == 39) {
					doMove = true;
					if(moveInX) {
						changeXYZ(false, false, true);
						movePositive = movePositive;
					}else if(moveInY) {
						changeXYZ(true, false, false);
						movePositive = movePositive;;
					} else if(moveInZ) {
						changeXYZ(true, false, false);
						movePositive = !movePositive;
					}
				} else if(code == 40) {
					doMove = true;
					if(moveInX) {
						changeXYZ(false, true, false);
						movePositive = false;
					}else if(moveInY) {
						changeXYZ(false, false, true);
						movePositive = movePositive;
					} else if(moveInZ) {
						changeXYZ(false, true, false);
						movePositive = false;
					}
				}
			}
		}
		function changeXYZ(x,y,z) {
			moveInX = x;
			moveInY = y;
			moveInZ = z;
		}
		gl.onmousewheel = function(e) {
			console.log("wheel");
			cam_pos[2] = cam_pos[2] - 5;
		}
		//basic phong shader
		var shaderWithTextures = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				attribute vec3 a_normal;\
				varying vec3 v_normal;\
				uniform mat4 u_model;\
				uniform mat4 u_mvp;\
				void main() {\
					v_normal = a_normal;\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				}\
				', '\
				precision highp float;\
				varying vec3 v_normal;\
				varying vec2 v_coord;\
				uniform samplerCube u_texture;\
				uniform vec3 u_camera_eye;\
				void main() {\
				  vec3 N = normalize(v_normal);\
				  vec4 color = textureCube( u_texture, N );\
				  gl_FragColor = color;\
				}\
			');
		//basic phong shader
		var shaderAxes = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				attribute vec4 a_color;\
				uniform mat4 u_mvp;\
				varying vec4 v_color;\
				void main() {\
					v_color = a_color;\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				}\
				', '\
				precision highp float;\
				uniform vec4 u_color;\
				varying vec4 v_color;\
				void main() {\
				  gl_FragColor = u_color * v_color;\
				}\
			');
		//basic phong shader
		var shader = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				attribute vec3 a_normal;\
				varying vec3 v_normal;\
				uniform mat4 u_mvp;\
				uniform mat4 u_model;\
				void main() {\
					v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				}\
				', '\
				precision highp float;\
				varying vec3 v_normal;\
				uniform vec3 u_lightvector;\
				uniform vec4 u_color;\
				void main() {\
				  vec3 N = normalize(v_normal);\
				  gl_FragColor = u_color * max(0.0, dot(u_lightvector,N));\
				}\
			');


		//generic gl flags and settings
		gl.clearColor(0.01,0.01,0.01,1);
		gl.enable( gl.DEPTH_TEST );
		gl.enable( gl.CULL_FACE );

		var modelt = mat4.create();

		//rendering loop
		gl.ondraw = function()
		{
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
			var L = vec3.normalize(vec3.create(),[1.5,1.1,1.4]);
			mat4.lookAt(view, cam_pos, look_to, [0,1,0]);
			
			mat4.multiply(temp,view,modelAxes);
			mat4.multiply(mvp,projection,temp);

			//compute rotation matrix for normals
			var modelt = mat4.toRotationMat4(mat4.create(), modelAxes);

			if(axes)
				shaderAxes.uniforms({
					u_color: [1,1,1,1],
					u_mvp: mvp
				}).draw(axes, gl.LINES);

			//compute rotation matrix for normals
			//texture.bind(0);
/*
			if(planes)
				shaderAxes.uniforms({
					u_color: [1,1,1,1],
					u_mvp: mvp
				}).draw(planes, gl.TRIANGLES);
*/
			//create modelview and projection matrices
			recalculateCubes();

			recalculateCamera();

			for(var i in objects)
			{
							
				var object = objects[i];

				mat4.multiply(temp,view,object.model); //modelview
				mat4.multiply(mvp,projection,temp); //modelviewprojection

				texture.bind(0);

				

				//render mesh of snake using the shaderWithTextures
				shader.uniforms({
					u_color: object.color,
					u_lightvector: L,
					u_model: object.model,
					u_mvp: mvp
				}).draw(object.mesh);
			}

			mat4.multiply(temp,view,ratoli.model); //modelview
			mat4.multiply(mvp,projection,temp); //modelviewprojection

			//compute rotation matrix for normals
			texture.bind(0);
			
			//render mesh of raton using the shader
			shaderWithTextures.uniforms({
				u_color: ratoli.color,
				u_texture: 0,
				u_lightvector: L,
				u_model: ratoli.model,
				u_mvp: mvp
			}).draw(ratoli.mesh);
		};

		//update loop
		gl.onforceupdate = function(dt)
		{
			//rotate world
			mat4.rotateY(modelAxes,modelAxes,dt*0.2);
			/*for(var i in objects)
			{
				mat4.rotateY(objects[i].model,objects[i].model,dt*0.2);
			}*/
			//mat4.rotateY(cam_pos,cam_pos,dt*0.2);
			//cube.rotateOnAxis( new THREE.Vector3(0,1,0), dt*0.2 );
		};

		//update loop
		gl.onupdate = function(dt)
		{
			//console.log((look_to[0] != objects[objects.length - 1].model[12])||(look_to[1] != objects[objects.length - 1].model[13])||(look_to[2] != objects[objects.length - 1].model[14]));
			//console.log(dVar);
			if((look_to[0] != objects[objects.length - 1].model[12])
				||(look_to[1] != objects[objects.length - 1].model[13])
				||(look_to[2] != objects[objects.length - 1].model[14])) {

					if(primeraVegada) {
						cam_pos_anterior = cam_pos;
						look_to_anterior = look_to;
						primeraVegada = false;
					}

					var incrementX = 0;
					var incrementY = 0;
					var incrementZ = 0;
					if(moveInX) {
						incrementX = (movePositive)?-40:+40;
						incrementY = (movePositive)?+40:+40;
						incrementZ = +10;
					} else if(moveInY) {
						incrementX = +10;
						incrementY = (movePositive)?-40:+40;
						incrementZ = (movePositive)?+40:-40;
					} else if(moveInZ) {
						incrementX = +10;
						incrementY = (movePositive)?+40:+40;
						incrementZ = (movePositive)?-40:+40;
					}
					cam_pos[0] = objects[objects.length - 2].model[12]*dVar + cam_pos_anterior[0]*(1-dVar) + incrementX;
					cam_pos[1] = objects[objects.length - 2].model[13]*dVar + cam_pos_anterior[1]*(1-dVar) + incrementY;
					cam_pos[2] = objects[objects.length - 2].model[14]*dVar + cam_pos_anterior[2]*(1-dVar) + incrementZ;

					look_to[0] = objects[objects.length - 1].model[12]*dVar + look_to_anterior[0]*(1 - dVar);
					look_to[1] = objects[objects.length - 1].model[13]*dVar + look_to_anterior[1]*(1 - dVar);
					look_to[2] = objects[objects.length - 1].model[14]*dVar + look_to_anterior[2]*(1 - dVar);

				} else {
					primeraVegada = false;
				}
			
			//cam_pos[0] = Math.sin( new Date().getTime() * 0.001 ) * 100;
			//cam_pos[0] = (cam_pos[0] + objects[0].posX)/2;
		};

		function recalculateCubes() {
			var movement = 6;

			if(!movePositive) {
				movement = movement*(-1);
			}

			var actualNumber = new Date().getSeconds();

			console.log(actualNumber);
			console.log(lastNumber);

			if(!lastNumber || (actualNumber != lastNumber)) {
				lastNumber = actualNumber;
				/*
				if(!sinusPositiu) {
					sinusNegatiu = false;
					sinusPositiu = true;
				} else if(!sinusNegatiu) {
					sinusNegatiu = true;
					sinusPositiu = false;
				}
				*/
				var model12;
				var model13;
				var model14;
				//console.log(objects.length);
				for(var i = 0; i < objects.length; i++) {
					//console.log(objects[i].model[12]);
					if(i < objects.length - 1) {
						model12 = objects[i].model[12];
						model13 = objects[i].model[13];
						model14 = objects[i].model[14];
						objects[i].model[12] = objects[i + 1].model[12];
						objects[i].model[13] = objects[i + 1].model[13];
						objects[i].model[14] = objects[i + 1].model[14];
					} else {
						var object = objects[i];

						if(doMove && (dVar >= 1)) {
							if(moveInX) {
								object.model[12] = object.model[12] + movement;
								doMove = false;
								dVar = 0;
							}
							if(moveInY) {
								object.model[13] = object.model[13] + movement;
								doMove = false;
								dVar = 0;
							}
							if(moveInZ) {
								object.model[14] = object.model[14] + movement;
								doMove = false;
								dVar = 0;
							}
						} else {
							//console.log(object.model[12] + "+" +  model12);
							//console.log(object.model[12] + (object.model[12] - model12))
							object.model[12] = object.model[12] + (object.model[12] - model12);
							object.model[13] = object.model[13] + (object.model[13] - model13);
							object.model[14] = object.model[14] + (object.model[14] - model14);
						}
					}
					//console.log(objects[i].model[12]);
					//console.log("bucle");
				}
				//console.log("fin");
				/*for(var i = 0; i < objects.length; i++) {
					console.log(objects[i].model[12]);
				}*/
				//console.log("fin2");
			}
		}

		function recalculateCamera() {
			if(dVar < 1) {
				dVar = dVar + 0.01;
			}
		}
	}
}
