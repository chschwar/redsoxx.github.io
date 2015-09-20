
function throwOnGLError(err, funcName, args) {
  throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
};

function logGLCall(functionName, args) {   
   console.log("gl." + functionName + "(" + 
      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");   
} 

function validateNoneOfTheArgsAreUndefined(functionName, args) {
  for (var ii = 0; ii < args.length; ++ii) {
    if (args[ii] === undefined) {
      console.error("undefined passed to gl." + functionName + "(" +
                     WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
    }
  }
} 

function logAndValidate(functionName, args) {
   logGLCall(functionName, args);
   validateNoneOfTheArgsAreUndefined (functionName, args);
   
}



var g_rotator;
var g_plane;
var g_sphere;
var g_cone;
var g_cube;
var g_cylinder;
var g_torus;

var gl;
var program;
var g_canvas;

var vPosition;
var vNormal;
var vUv;

var modelMatrixLocation;
var projectionMatrixLocation;
var viewMatrixLocation;
var normalMatrixLocation;

var materialAmbientProductLocation;
var materialDiffuseProductLocation;
var materialSpecularProductLocation;
var materialShininessLocation;

// lighting computations
var g_time = 0.0;

var g_materialAmbient = vec4( 0.0, 1.0, 1.0, 1.0 );
var g_materialDiffuse = vec4( 0.0, 1.0, 1.0, 1.0);
var g_materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var g_materialShininess = 70.0;

var g_eye = vec3(1,1,1);
var g_at = vec3(-1, 0, 0.0);
var g_up = vec3(0.0, 0.0, 1.0);

var g_directionalLight = null;
var vw_matrix = null;


var g_lightLocationIdx = 0;
var g_lightTypeIdx = 1;

window.onload = function init() 
{
    g_canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(g_canvas);
    if (!gl) 
    {
      alert("WebGL isn't available");
    }
    
    // DEBGUGGING
    //gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError);
    //gl = WebGLDebugUtils.makeDebugContext(gl, undefined, logGLCall);
    //gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, logAndValidate);
    
    
    
    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, g_canvas.width, g_canvas.height);
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    
    document.getElementById("light").value = "0";
    document.getElementById("light").onchange = function() 
    {
        var val = Number(this.value);
        g_lightLocationIdx = val;
        render();
    };
    
    document.getElementById("lighttype").value = "1";
    document.getElementById("lighttype").onchange = function() 
    {
        var val = Number(this.value);
        g_lightTypeIdx = val;
        render();
    };

    //  Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    vPosition = gl.getAttribLocation(program, "vPosition");
    vNormal = gl.getAttribLocation(program, "vNormal");
    vUv = gl.getAttribLocation(program, "vUv");
    
    modelMatrixLocation = gl.getUniformLocation(program, "ml_matrix");
    projectionMatrixLocation = gl.getUniformLocation(program, "pr_matrix");
    viewMatrixLocation = gl.getUniformLocation(program, "vw_matrix");
    normalMatrixLocation = gl.getUniformLocation(program, "normal_matrix");
    
    materialAmbientProductLocation = gl.getUniformLocation(program, "ambientProduct");
    materialDiffuseProductLocation = gl.getUniformLocation(program, "diffuseProduct");
    materialSpecularProductLocation = gl.getUniformLocation(program, "specularProduct");
    materialShininessLocation = gl.getUniformLocation(program, "materialShininess");
    
    lightLocation = gl.getUniformLocation(program,"uLightPosition_world");
    
    genOrthogonalProjectionMatrix();
    sendProjectionMatrixToShader();
    
    
    //g_canvas.addEventListener("mousedown", mouseDown, false);
    //g_canvas.addEventListener("mouseup", mouseUp, false);
    //g_canvas.addEventListener("mouseout", mouseUp, false);
    //g_canvas.addEventListener("mousemove", mouseMove, false);
    //g_eye = vec3(2,2,10);
    
    g_plane = new Plane(20);
    g_plane.initialize();
        
    g_cylinder = new Cylinder(30);
    g_cylinder.initialize();
    
    g_cone = new Cone(30);
    g_cone.initialize();
    
    g_cube = new Cube();
    g_cube.initialize();
    
    g_sphere = new Sphere(30,30,0);
    g_sphere.initialize();
    
    g_torus = new Torus(0.3,0.2,20,20);
    g_torus.initialize();
        
    g_lightSphere = new Sphere(10,10,0);
    g_lightSphere.initialize();
    
    genPerspectiveProjectionMatrix();
    sendProjectionMatrixToShader();
    
    g_directionalLight = new DirectionalLight();
    g_directionalLight.setPosition(vec4(-1,0.0,0.1,1));
    g_directionalLight.setDirection(normalize(vec4(0,1,0,1), true));
    g_directionalLight.setAmbientLight(vec4(0.1,0.1,0.1,1));
    g_directionalLight.setDiffuseLight(vec4(1.0,1.0,1.0,1));
    g_directionalLight.setSpecularLight(vec4(1.0,1.0,1.0,1));
    
    /*g_rotator = new TrackballRotator(g_canvas, render, 1);
    g_rotator.setView(1);*/
    render();
};


function sendProjectionMatrixToShader()
{
    gl.uniformMatrix4fv(projectionMatrixLocation, false, flatten(pr_matrix));
}

function genPerspectiveProjectionMatrix()
{
    // function perspective( fovy, aspect, near, far )
    pr_matrix = perspective(65, 1, 0.1, 60);
    sendProjectionMatrixToShader();
}

function genOrthogonalProjectionMatrix()
{
    // function ortho( left, right, bottom, top, near, far )
    pr_matrix = ortho(-10,10,-10,10,0,30);
    sendProjectionMatrixToShader();
}

function buildModelMatrix(tx,ty,tz,sx,sy,sz,rx,ry,rz)
{
    var scaleMatrix = scalem(sx,sy,sz);
    var rotXMatrix = rotate(rx, vec3(1,0,0));
    var rotYMatrix = rotate(ry, vec3(0,1,0));
    var rotZMatrix = rotate(rz, vec3(0,0,1));
    var translationMatrix = translate(tx,ty,tz);
    
    var rotationMatrix = mult(rotYMatrix, rotZMatrix);
    rotationMatrix = mult(rotXMatrix, rotationMatrix);
    
    modelMatrix = mult(translationMatrix, mult(rotationMatrix, scaleMatrix));
    return modelMatrix;
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    vw_matrix = lookAt(g_eye, g_at, g_up);
    
    gl.uniformMatrix4fv(viewMatrixLocation, false, flatten(vw_matrix));    
    send(g_materialAmbient, g_materialDiffuse, g_materialSpecular, g_materialShininess);
    
    if (null != g_plane)
    {
        ml_matrix = buildModelMatrix(0,0,-0.5,10,10,10, 0,0,0);
        var normalmatrix = normalMatrix(mult(vw_matrix,ml_matrix),true);
        gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(ml_matrix));
        gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalmatrix));
        g_plane.renderDump();
    }
    if (null != g_sphere)
    {
        ml_matrix = buildModelMatrix(-0.5,-0.5,0,0.1,0.1,0.1, 0,0,0);
        var normalmatrix = normalMatrix(mult(vw_matrix,ml_matrix),true);
        gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(ml_matrix));
        gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalmatrix));
        g_sphere.renderDump();
    }
    if (null != g_cone)
    {
        ml_matrix = buildModelMatrix(-0.2,0,0.3,.1,.1, .1,0,3,5);
        var normalmatrix = normalMatrix(mult(vw_matrix,ml_matrix),true);
        gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(ml_matrix));
        gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalmatrix));
        g_cone.renderDump();
    }
    if (null != g_cube)
    {
        ml_matrix = buildModelMatrix(0,0,0.0,0.1,0.1,0.1, 0,0,0);
        var normalmatrix = normalMatrix(mult(vw_matrix,ml_matrix),true);
        gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(ml_matrix));
        gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalmatrix));
        g_cube.renderDump();
    }
    if (null != g_cylinder)
    {
        ml_matrix = buildModelMatrix(-1,0,0,0.1,0.1,0.1, 45,0,0);
        var normalmatrix = normalMatrix(mult(vw_matrix,ml_matrix),true);
        gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(ml_matrix));
        gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalmatrix));
        g_cylinder.renderDump();
    }
    if (null != g_torus)
    {
        ml_matrix = buildModelMatrix(-1,0,0.3,0.5,0.5,0.5, 45,45,0);
        var normalmatrix = normalMatrix(mult(vw_matrix,ml_matrix),true);
        gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(ml_matrix));
        gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalmatrix));
        g_torus.renderDump();
    }
    
    requestAnimFrame( render );
}


var g_lightPositions = [  // values for light position, selected by popup menu
    [0,0,0,1], [0,0,1,0], [0,1,0,0], [0,1,1,0], [0,0,-10,1], [2,3,5,0]
];


function send(materialAmbient, materialDiffuse, materialSpecular, materialShininess)
{
    var lightPosition = g_directionalLight.getPosition();
    var lightDirection = g_directionalLight.getDirection();
    var ambientLight = g_directionalLight.getAmbientLight();
    var diffuseLight = g_directionalLight.getDiffuseLight();
    var specularLight = g_directionalLight.getSpecularLight();
    
    var newLightPosition = vec4( lightPosition[0],lightPosition[1],lightPosition[2],lightPosition[3]);
    newLightPosition = g_lightPositions[g_lightLocationIdx];
    //newLightPosition = vec4(-0.02,0.0,1,1);
    
    //newLightPosition[0] = 1.5*Math.sin(0.01*g_time)-1.5;
    //newLightPosition[1] = 1.5*Math.cos(0.01*g_time);
    //newLightPosition[2] = 0.1;
    
    
    var g_lightTypeLocation = gl.getUniformLocation(program, "uLightType");
    gl.uniform1i(g_lightTypeLocation, g_lightTypeIdx);
    
    var g_lightDirectionLocation = gl.getUniformLocation(program, "uLightDirection_eye");
    gl.uniform4fv(g_lightDirectionLocation, flatten(lightDirection));
    
        
    if (null != g_lightSphere)
    {
        ml_matrix = buildModelMatrix(newLightPosition[0],newLightPosition[1],newLightPosition[2],0.01,0.01,0.01, 0,0,0);
        //var normalmatrix = normalMatrix(mult(vw_matrix,ml_matrix),true);
        var normalmatrix = normalMatrix(ml_matrix,true);
        gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(ml_matrix));
        gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalmatrix));
        g_lightSphere.renderDump();
    }
    
    
    g_time += 1;

    var ambientProduct = mult(ambientLight, materialAmbient);
    var diffuseProduct = mult(diffuseLight, materialDiffuse);
    var specularProduct = mult(specularLight, materialSpecular);
    
   
    
    gl.uniform4fv(materialAmbientProductLocation, flatten(ambientProduct));
    gl.uniform4fv(materialDiffuseProductLocation, flatten(diffuseProduct));
    gl.uniform4fv(materialSpecularProductLocation, flatten(specularProduct));
    gl.uniform4fv(lightLocation, flatten(newLightPosition));
    gl.uniform1f(materialShininessLocation, materialShininess);
    
}
