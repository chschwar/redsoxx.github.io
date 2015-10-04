
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


var g_plane;
var g_sphere;
var g_cone;
var g_cube;
var g_cylinder;



window.onload = function init() 
{
    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) 
    {
      alert("WebGL isn't available");
    }
    
    // DEBGUGGING
    //gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError);
    //gl = WebGLDebugUtils.makeDebugContext(gl, undefined, logGLCall);
    //gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, logAndValidate);
    
    
    resetGui();
    handleRotation();
    
    document.getElementById( "SelectTextureMapping" ).onchange = function()
    {
        var textureMappingType = document.getElementById("SelectTextureMapping");
        g_textureMappingTypeValue = textureMappingType.value;
        createSphere();
    }; 
    
    
    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

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
    
    lightLocation = gl.getUniformLocation(program,"lightPosition");
    
    genPerspectiveProjectionMatrix();
    sendProjectionMatrixToShader();
    
    configureTexture(image2);
    
    //gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW)
    gl.cullFace(gl.FRONT)
    
    
    
    g_plane = new Plane(8);;
    g_sphere = new Sphere(20,20,0);
    g_cone = new Cone(10);
    g_cube = new Cube();
    g_cylinder = new Cylinder(10);
    
    
    render();
};