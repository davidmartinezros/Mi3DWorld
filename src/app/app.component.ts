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
		var cube_mesh = GL.Mesh.cube({size:10});
		var cam_pos = vec3.fromValues(200,200,200);

		var geometry = new THREE.BoxGeometry( 1, 1, 1 );
		var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		var cube = new THREE.Mesh( geometry, material );

		//create basic matrices for cameras and transformation
		var projection = /*window.persp = */mat4.create();
		var view = /*window.view = */mat4.create();
		var mvp = /*window.mvp = */mat4.create();
		var temp = mat4.create();
		var modelAxes = mat4.create();

		var objects: any[][][] = [];

		var mesh = GL.Mesh.cube({size:10});

		var posI: string = '0';

		var posJ: string = '0';

		var posK: string = '0';

		var lastObject;

		var lastPosI: string = '0';

		var lastPosJ: string = '0';

		var lastPosK: string = '0';

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
		for(var i = 0; i < data.length; i++) {
			var o = data[i];
			objects[i] = [];
			objects[i][0] = [];
			objects[i][0].push({ color: [o.colorR,o.colorG,o.colorB,o.colorAlpha], model: mat4.translationMatrix( [o.posX*12,o.posY*12,o.posZ*12] ), mesh: cube_mesh, translate: false, axe: "X" });
		}

		var texture = GL.Texture.fromURL("assets/texture.png",{temp_color:[80,120,40,255], minFilter: gl.LINEAR_MIPMAP_LINEAR});
/*
		for(var x = -10; x <= 10; x++)
			for(var y = -5; y <= 5; y++)
				objects.push({ color: [0.3,0.3,0.3,1.0], model: mat4.translationMatrix( [x*12,y*12,0] ), mesh: cube_mesh });
*/
		//set the camera perspective
		mat4.perspective( projection, 45 * DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
		//mat4.ortho(persp, -50,50,-50,50,0,500); //ray doesnt work in perspective

		function getClosestObject(x,y)
		{
			mat4.multiply( mvp, projection, view );
			var RT = new GL.Raytracer( mvp );
			var ray = RT.getRayForPixel(x,y);

			var closest_object = null;
			var closest_t = 100000000;

			var trobat = false;

			for(var i in objects)
			{
				var objectsMatrix = objects[i];

				for(var j in objectsMatrix)
				{
					var objectsRow = objectsMatrix[j];

					for(var k in objectsRow)
					{
						var object = objectsRow[k];

						var result = Raytracer.hitTestBox( cam_pos, ray, BBox.getMin(object.mesh.bounding), BBox.getMax(object.mesh.bounding), object.model );
						if(result && closest_t > result.t)
						{
							closest_object = object;
							closest_t = result.t;
							//console.log(i);
							//console.log(posI);
							posI = i;
							posJ = j;
							posK = k;
							trobat = true;
						} 
					}
				}
			}
			if(!trobat) {
				posI = null;
				posJ = null;
				posK = null;
			}
			return closest_object;
		}

		gl.captureMouse();
		gl.onmousemove = function(e) {
			var dz = 50;
			var object = getClosestObject(e.canvasx, gl.canvas.height - e.canvasy);
			
			//console.log(posI);
			if(object && !object.translate) {
				vec3.random( object.color );
				console.log("over");
				object.translate = true;
				if(object.axe == 'X') {
					var j = 1;
					while(j < 10){
						objects[posI][j] = [];
						objects[posI][j].push({ color: [object.color], model: mat4.translationMatrix( [object.model[12],object.model[13],object.model[14] + j*12] ), mesh: cube_mesh, translate: false, axe: "Z" });
						j++;
					}
				} else if(object.axe == 'Z') {
					var k = 1;
					while(k < 10){
						objects[posI][posJ].push({ color: [object.color], model: mat4.translationMatrix( [object.model[12],object.model[13] + k*12,object.model[14]] ), mesh: cube_mesh, translate: false, axe: "Y" });
						k++;
					}
				}
				
			}
			//console.log(object);
			if(object == null || object != lastObject) {
				if(lastPosI && lastPosJ && lastObject && lastObject.translate) {
					if(posI != lastPosI) {
						console.log("out lastPosI"+posI+lastPosI);
						var objectEval = objects[lastPosI][0][0];
						lastObject.translate = false;
						objects[lastPosI] = [];
						objects[lastPosI][0] = [];
						objects[lastPosI][0].push(objectEval);
						lastObject = null;
						lastPosI = null;
						lastPosJ = null;
						lastPosK = null;
					} else if(posJ != lastPosJ) {
						console.log("out lastPosJ"+posJ+lastPosJ);
						lastObject.translate = false;
						objects[lastPosI][lastPosJ] = [];
						objects[lastPosI][lastPosJ].push(lastObject);
						lastObject = null;
						lastPosI = null;
						lastPosJ = null;
						lastPosK = null;
					} else if(posK != lastPosK) {
						console.log("out lastPosK"+posK+lastPosK);
					} else if(object == null) {
						console.log("out object is null");
						lastObject.translate = false;
						objects[lastPosI][0] = [];
						objects[lastPosI][0].push(lastObject);
						lastObject = null;
						lastPosI = null;
						lastPosJ = null;
						lastPosK = null;
					}
				}
			}

			if(e.dragging) {
				mat4.rotateY(modelAxes,modelAxes,e.deltax * 0.01);
				cam_pos[1] += e.deltay;
			}

			if(lastObject == null || !lastObject.translate) {
				lastObject = object;
				lastPosI = posI;
				lastPosJ = posJ;
				lastPosK = posK;
			}
		}
		gl.onmousedown = function(e) {
			if(gl.mouse.left_button) {
				var dz = 50;

				var object = getClosestObject(e.canvasx, gl.canvas.height - e.canvasy);
				if(object) {
					console.log(object.model);
					object.model = mat4.translationMatrix( [object.model[12],object.model[13],object.model[14] + dz] );
					console.log(object.model);
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
		gl.onmousewheel = function(e) {
			console.log("wheel");
			cam_pos[2] = cam_pos[2] - 5;
		}
		//basic phong shader
		var shaderPlanes = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				attribute vec3 a_normal;\
				attribute vec2 a_coord;\
				varying vec3 v_normal;\
				varying vec2 v_coord;\
				uniform mat4 u_mvp;\
				uniform mat4 u_model;\
				void main() {\
					v_coord = a_coord;\
					v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				}\
				', '\
				precision highp float;\
				varying vec3 v_normal;\
				varying vec2 v_coord;\
				uniform vec3 u_lightvector;\
				uniform vec4 u_color;\
				uniform sampler2D u_texture;\
				void main() {\
				  vec3 N = normalize(v_normal);\
				  vec4 color = u_color * texture2D( u_texture, v_coord);\
				  gl_FragColor = color * max(0.0, dot(u_lightvector,N));\
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
			mat4.lookAt(view, cam_pos, [0,0,0], [0,1,0]);
			
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
			for(var i in objects)
			{
				var objectsMatrix = objects[i];

				for(var j in objectsMatrix)
				{
					var objectsRow = objectsMatrix[j];

					for(var k in objectsRow)
					{
						//console.log("i:" + i + "j:" + j);
						
						var object = objectsRow[k];

						//console.log("model:" + object.model);

						mat4.multiply(temp,view,object.model); //modelview
						mat4.multiply(mvp,projection,temp); //modelviewprojection

						//render mesh using the shader
						shader.uniforms({
							u_color: object.color,
							u_lightvector: L,
							u_model: object.model,
							u_mvp: mvp
						}).draw(object.mesh);
					}
				}
			}
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
			//cam_pos[0] = Math.sin( new Date().getTime() * 0.001 ) * 100;
			//cam_pos[0] = (cam_pos[0] + objects[0].posX)/2;
		};
	}
}
