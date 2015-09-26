
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

var gl;
var g_canvas;

var g_rotator;
var g_plane;
var g_sphere;
var g_cone;
var g_cube;
var g_cylinder;
var g_torus;


var vPosition;
var vNormal;
var vUv;


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


var g_ml_matrix = null;
var g_vw_matrix = null;
var g_pr_matrix = null;
var g_normal_matrix = null;
var g_shadow_matrix = null;


var g_lightLocationIdx = 2;
var g_lightTypeIdx = 1;

var g_depthMapFrameBuffer = 0;


function initialize()
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
    
    //  Load shaders and initialize attribute buffers
    initShadowShaders();
}

window.onload = function init() 
{
    initialize();
    
    document.getElementById("light").value = "0";
    document.getElementById("light").onchange = function() 
    {
        var val = Number(this.value);
        g_lightLocationIdx = val;
        shadowRenderer();
    };
    
    document.getElementById("lighttype").value = "1";
    document.getElementById("lighttype").onchange = function() 
    {
        var val = Number(this.value);
        g_lightTypeIdx = val;
        shadowRenderer();
    };

    
    normalize(vec3(0,0,0));
    
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
    
    g_directionalLight = new DirectionalLight();
    g_directionalLight.setPosition(vec4(-1,0.0,0.1,1));
    g_directionalLight.setDirection(normalize(vec4(0,1,0,1), true));
    g_directionalLight.setAmbientLight(vec4(0.1,0.1,0.3,1));
    g_directionalLight.setDiffuseLight(vec4(1.0,1.0,1.0,1));
    g_directionalLight.setSpecularLight(vec4(1.0,1.0,1.0,1));
    
    
    
    // initialize everything for creating a depth map for shadow mapping    
    shadowRenderer();
};


function sendProjectionMatrixToShader()
{
    gl.uniformMatrix4fv(g_pr_matrix_location, false, flatten(g_pr_matrix));
}

function genPerspectiveProjectionMatrix()
{
    // function perspective( fovy, aspect, near, far )
    g_pr_matrix = perspective(65, 1, 1, 200);
    sendProjectionMatrixToShader();
}

function genOrthogonalProjectionMatrix()
{
    // function ortho( left, right, bottom, top, near, far )
    g_pr_matrix = ortho(-10,10,-10,10,1,30);
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

function renderScene()
{
    if (null != g_plane)
    {
        g_ml_matrix = buildModelMatrix(0,0,-0.5,10,10,10, 0,0,0);
        //g_normal_matrix = normalMatrix(mult(g_vw_matrix,g_ml_matrix),true);
        g_normal_matrix = normalMatrix(g_ml_matrix,true);
        gl.uniformMatrix4fv(g_ml_matrix_location, false, flatten(g_ml_matrix));
        gl.uniformMatrix3fv(g_normal_matrix_location, false, flatten(g_normal_matrix));
        g_plane.renderDump();
    }
    if (null != g_sphere)
    {
        g_ml_matrix = buildModelMatrix(-0.5,-0.5,0,0.1,0.1,0.1, 0,0,0);
        //g_normal_matrix = normalMatrix(mult(g_vw_matrix,g_ml_matrix),true);
        g_normal_matrix = normalMatrix(g_ml_matrix,true);
        gl.uniformMatrix4fv(g_ml_matrix_location, false, flatten(g_ml_matrix));
        gl.uniformMatrix3fv(g_normal_matrix_location, false, flatten(g_normal_matrix));
        g_sphere.renderDump();
    }
    if (null != g_cone)
    {
        g_ml_matrix = buildModelMatrix(-0.2,0,0.3,.1,.1, .1,0,3,5);
        //g_normal_matrix = normalMatrix(mult(g_vw_matrix,g_ml_matrix),true);
        g_normal_matrix = normalMatrix(g_ml_matrix,true);
        gl.uniformMatrix4fv(g_ml_matrix_location, false, flatten(g_ml_matrix));
        gl.uniformMatrix3fv(g_normal_matrix_location, false, flatten(g_normal_matrix));
        g_cone.renderDump();
    }
    if (null != g_cube)
    {
        g_ml_matrix = buildModelMatrix(0,0,0.0,0.1,0.1,0.1, 0,0,0);
        //g_normal_matrix = normalMatrix(mult(g_vw_matrix,g_ml_matrix),true);
        g_normal_matrix = normalMatrix(g_ml_matrix,true);
        gl.uniformMatrix4fv(g_ml_matrix_location, false, flatten(g_ml_matrix));
        gl.uniformMatrix3fv(g_normal_matrix_location, false, flatten(g_normal_matrix));
        g_cube.renderDump();
    }
    if (null != g_cylinder)
    {
        g_ml_matrix = buildModelMatrix(-1,0,0,0.1,0.1,0.1, 45,0,0);
        //g_normal_matrix = normalMatrix(mult(g_vw_matrix,g_ml_matrix),true);
        g_normal_matrix = normalMatrix(g_ml_matrix,true);
        gl.uniformMatrix4fv(g_ml_matrix_location, false, flatten(g_ml_matrix));
        gl.uniformMatrix3fv(g_normal_matrix_location, false, flatten(g_normal_matrix));
        g_cylinder.renderDump();
    }
    if (null != g_torus)
    {
        g_ml_matrix = buildModelMatrix(-1,0,0.3,0.5,0.5,0.5, 45,45,0);
        //g_normal_matrix = normalMatrix(mult(g_vw_matrix,g_ml_matrix),true);
        g_normal_matrix = normalMatrix(g_ml_matrix,true);
        gl.uniformMatrix4fv(g_ml_matrix_location, false, flatten(g_ml_matrix));
        gl.uniformMatrix3fv(g_normal_matrix_location, false, flatten(g_normal_matrix));
        g_torus.renderDump();
    }
}


var g_lightPositions_world = 
[  // values for light position, selected by popup menu
    vec4(1,1,0,1),
    vec4(-1,1,0,1),
    vec4(0,1,1,1), 
    vec4(0,1,-1,1), 
    vec4(1,1,0,1), 
    vec4(-1,1,0,1), 
    vec4(0,1,1,1), 
    vec4(0,1,-1,1), 
    vec4(1,1,1,1), 
    vec4(-1,1,-1,1), 
    vec4(1,1,1,1),
    vec4(-1,1,-1,1)
];

var g_lightDirection_world = 
[  // values for light position, selected by popup menu
    subtract(vec4(0,0,0,1), g_lightPositions_world[0]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[1]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[2]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[3]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[4]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[5]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[6]),
    subtract(vec4(0,0,0,1), g_lightPositions_world[7]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[8]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[9]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[10]), 
    subtract(vec4(0,0,0,1), g_lightPositions_world[11])
];


function send(materialAmbient, materialDiffuse, materialSpecular, materialShininess)
{
    var lightPosition = g_directionalLight.getPosition();
    var lightDirection = g_directionalLight.getDirection();
    var ambientLight = g_directionalLight.getAmbientLight();
    var diffuseLight = g_directionalLight.getDiffuseLight();
    var specularLight = g_directionalLight.getSpecularLight();
    
    var newLightPosition = g_lightPositions_world[g_lightLocationIdx];
    //console.log(g_lightDirection_world[g_lightLocationIdx]);
    var newLightDirection = normalize(g_lightDirection_world[g_lightLocationIdx],true);
    newLightDirection = vec4(newLightDirection[0],newLightDirection[1],newLightDirection[2],1);
    //newLightPosition = vec4(-0.02,0.0,1,1);
    
    newLightPosition[0] = 1.8*Math.sin(0.01*g_time)-1.5;
    newLightPosition[1] = 1.8*Math.cos(0.01*g_time);
    newLightPosition[2] = 0.5+Math.sin(0.01*g_time)*0.5;
    
    
    
    
        
    if (null != g_lightSphere)
    {
        g_ml_matrix = buildModelMatrix(newLightPosition[0],newLightPosition[1],newLightPosition[2],0.01,0.01,0.01, 0,0,0);
        //g_normal_matrix = normalMatrix(mult(g_vw_matrix,g_ml_matrix),true);
        g_normal_matrix = normalMatrix(g_ml_matrix,true);
        gl.uniformMatrix4fv(g_ml_matrix_location, false, flatten(g_ml_matrix));
        gl.uniformMatrix3fv(g_normal_matrix_location, false, flatten(g_normal_matrix));
        g_lightSphere.renderDump();
    }
    
    
    g_time += 1;

    var ambientProduct = mult(ambientLight, materialAmbient);
    var diffuseProduct = mult(diffuseLight, materialDiffuse);
    var specularProduct = mult(specularLight, materialSpecular);
    
   
    
    gl.uniform4fv(g_shadow_materialAmbientProductLocation, flatten(ambientProduct));
    gl.uniform4fv(g_shadow_materialDiffuseProductLocation, flatten(diffuseProduct));
    gl.uniform4fv(g_shadow_materialSpecularProductLocation, flatten(specularProduct));
    gl.uniform4fv(g_shadow_lightLocation, flatten(newLightPosition));
    gl.uniform1f(g_shadow_materialShininessLocation, materialShininess);
    var g_lightTypeLocation = gl.getUniformLocation(g_shadowProgram, "uLightType");
    gl.uniform1i(g_lightTypeLocation, g_lightTypeIdx);
    
    var g_lightDirection_worldLocation = gl.getUniformLocation(g_shadowProgram, "uLightDirection_eye");
    gl.uniform4fv(g_lightDirection_worldLocation, flatten(newLightDirection));
    
}



var OFFSCREEN_HEIGHT = 2048;
var OFFSCREEN_WIDTH = 2048;

//var g_vPosition = 0;
//var g_vNormal = 0;
//var g_vUv = 0;

var g_ml_matrix_location = 0;
var g_pr_matrix_location = 0;
var g_vw_matrix_location = 0;
var g_normal_matrix_location = 0;
var g_uShadowMatrix = mat4();

// #####################################################
// https://www.ssucet.org/~jhudson/15/2802/shadowbuffer/
// shadow mapping procedure:
// #####################################################

// Render scene using light as eye point
// For each pixel: Output color = distance from eye 
// - Goes to FBO: Easiest way = Float buffer 

// Render from camera viewpoint 
// For each vertex: 
// - Process as usual in vertex shader 
// - For each fragment: 
// - - Get world space coord for point we're rendering 
// - - - Already have this: For lighting computation 
// - - Put into light's eye space, get Z coord 
// - - Put into light's screen space, get XY coords 
// - - Use XY to look up value from FBO 
// - - Compare to Z coord 
// - - If Z coord > texture color 
// - - - Point is in shadow 
// - - Else: Point is lit

function shadowRenderer()
{   
    //firstPass();
    secondPass();
    requestAnimFrame( shadowRenderer );
}

// then render from camera's perspective
function secondPass()
{
    vPosition = g_shadow_vPositionLocation;
    vNormal = g_shadow_vNormalLocation;
    vUv = g_shadow_vUvLocation;

    g_ml_matrix_location = g_shadow_mlMatrixLocation;
    g_pr_matrix_location = g_shadow_prMatrixLocation;
    g_vw_matrix_location = g_shadow_vwMatrixLocation;
    g_normal_matrix_location = g_shadow_normal_matrix_location;

    gl.viewport(0, 0, g_canvas.width, g_canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    g_vw_matrix = lookAt(g_eye, g_at, g_up);
    gl.useProgram(g_shadowProgram);
    
    genPerspectiveProjectionMatrix();
    gl.uniformMatrix4fv(g_vw_matrix_location, false, flatten(g_vw_matrix));    
    send(g_materialAmbient, g_materialDiffuse, g_materialSpecular, g_materialShininess);
        
    renderScene();
}























var g_shadowProgram = null;

var g_shadow_vPositionLocation = 0;
var g_shadow_vNormalLocation = 0;
var g_shadow_vUvLocation = 0;

var g_shadow_mlMatrixLocation = 0;
var g_shadow_prMatrixLocation = 0;
var g_shadow_vwMatrixLocation = 0;
var g_shadow_normal_matrix_location = 0;

var g_shadow_lightLocation = 0;
var g_shadow_lightTypeLocation = 0;
var g_shadow_lightDirectionLocation = 0;

var g_shadow_materialAmbientProductLocation = 0;
var g_shadow_materialDiffuseProductLocation = 0;
var g_shadow_materialSpecularProductLocation = 0;
var g_shadow_materialShininessLocation = 0;

function initShadowShaders()
{
    g_shadowProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(g_shadowProgram);
    
    g_shadow_vPositionLocation = gl.getAttribLocation(g_shadowProgram, "vPosition");
    g_shadow_vNormalLocation = gl.getAttribLocation(g_shadowProgram, "vNormal");
    g_shadow_vUvLocation = gl.getAttribLocation(g_shadowProgram, "vUv");
    
    g_shadow_mlMatrixLocation = gl.getUniformLocation(g_shadowProgram, "ml_matrix");
    g_shadow_prMatrixLocation = gl.getUniformLocation(g_shadowProgram, "pr_matrix");
    g_shadow_vwMatrixLocation = gl.getUniformLocation(g_shadowProgram, "vw_matrix");
    g_shadow_normal_matrix_location = gl.getUniformLocation(g_shadowProgram, "normal_matrix");
    
    g_shadow_lightLocation = gl.getUniformLocation(g_shadowProgram,"uLightPosition_world");
    g_shadow_lightTypeLocation = gl.getUniformLocation(g_shadowProgram, "uLightType");    
    g_shadow_lightDirectionLocation = gl.getUniformLocation(g_shadowProgram, "uLightDirection_eye");
    
    g_shadow_materialAmbientProductLocation = gl.getUniformLocation(g_shadowProgram, "ambientProduct");
    g_shadow_materialDiffuseProductLocation = gl.getUniformLocation(g_shadowProgram, "diffuseProduct");
    g_shadow_materialSpecularProductLocation = gl.getUniformLocation(g_shadowProgram, "specularProduct");
    g_shadow_materialShininessLocation = gl.getUniformLocation(g_shadowProgram, "materialShininess");
    
    
    
    gl.useProgram(null);
}
















var g_depthProgram = null;

var g_depth_vPositionLocation = 0;
var g_depth_vNormalLocation = 0;
var g_depth_vUvLocation = 0;

var g_depth_mlMatrixLocation = 0;
var g_depth_prMatrixLocation = 0;
var g_depth_vwMatrixLocation = 0;
var g_depth_normal_matrix_location = 0;


function initDepthShaders()
{
    g_depthProgram = initShaders(gl, "depthMap-vertex-shader", "depthMap-fragment-shader");
    gl.useProgram(g_depthProgram);
    
    g_depth_vPositionLocation = gl.getAttribLocation(g_depthProgram, "vPosition");
    g_depth_vNormalLocation = gl.getAttribLocation(g_depthProgram, "vNormal");
    g_depth_vUvLocation = gl.getAttribLocation(g_depthProgram, "vUv");
    
    g_depth_mlMatrixLocation = gl.getUniformLocation(g_depthProgram, "ml_matrix");
    g_depth_prMatrixLocation = gl.getUniformLocation(g_depthProgram, "pr_matrix");
    g_depth_vwMatrixLocation = gl.getUniformLocation(g_depthProgram, "vw_matrix");
    g_depth_normal_matrix_location = gl.getUniformLocation(g_depthProgram, "normal_matrix");
    
    gl.useProgram(null);
}