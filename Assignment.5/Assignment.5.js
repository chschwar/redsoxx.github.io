var gl;
var program;

var diffuseMap = null;
var bumpMap = null;

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
var g_lightPosition = vec4(0.0, 0.0, -3.0, 0.0 );
var lightAmbient = vec4(0.4, 0.4, 0.4, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var g_time = 0.0;

var g_materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var g_materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);
var g_materialSpecular = vec4( 1.0, 1.0, 0.0, 1.0 );
var g_materialShininess = 100.0;

var lightLocation;

var pr_matrix;
var ml_matrix;
var vw_matrix;

var g_rx = 0;
var g_ry = 0;
var g_rz = 0;

var g_textureMappingTypeValue = 0;

var g_earthImage = document.getElementById("earthMap");

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



var sphere = null;

function sendProjectionMatrixToShader()
{
    gl.uniformMatrix4fv(projectionMatrixLocation, false, flatten(pr_matrix));
}

function genPerspectiveProjectionMatrix()
{
    // function perspective( fovy, aspect, near, far )
    pr_matrix = perspective(65, 1, 0, 30);
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

function resetGui()
{
    var textureMappingType = document.getElementById("SelectTextureMapping");
    textureMappingType.value = 0;
    g_textureMappingTypeValue = 0;
    
    var sliderX = document.getElementById("rx");
    var sliderY = document.getElementById("ry");
    var sliderZ = document.getElementById("rz");
    
    var rx = document.getElementById("RotationX");
    var ry = document.getElementById("RotationY");
    var rz = document.getElementById("RotationZ");
    
    sliderX.value = 0;
    sliderY.value = 0;
    sliderZ.value = 0;
    rx.value = 0;
    ry.value = 0;
    rz.value = 0;
    
    g_rx = 0;
    g_ry = 0;
    g_rz = 0;
    
    g_time = 0.0;
}


function useDiffuseTextureFromWeb()
{
    var id = document.getElementById("diffuseMapUrl").value;
    if (0 == id)
    {
        configureTexture(emptyTexture2, 0);
    }
    else if (1 == id)
    {
        configureTexture(image2, 0);
    }
    else if(2 == id)
    {
        var g_earthImage = document.getElementById("earthMap");
        if (null != g_earthImage)
        {            
            var texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, g_earthImage);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
    }
    else
    {
        configureTexture(emptyTexture2, 0);
    }
}

function useBumpTextureFromWeb()
{
    var id = document.getElementById("bumpMapUrl").value;
    if (0 == id)
    {
        configureTexture(image2, 1);
    }
    else
    {
        configureTexture(emptyTexture2, 1);
    }
}


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
    
    
    createSphere();
    render();
};

// https://books.google.de/books?id=IfDouSUqOUIC&pg=PA569&lpg=PA569&dq=sphere+texture+mapping+acos&source=bl&ots=h-ei-M9zjX&sig=F9BZUEppZSSOadRM5Y51-jPvh8Y&hl=de&sa=X&ved=0CDEQ6AEwAmoVChMIzpm4y7jjxwIVyaZyCh1HwQ9l#v=onepage&q=sphere%20texture%20mapping%20acos&f=false

function render()
{
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    
    ml_matrix = buildModelMatrix(0,0,-5,1,1,1,g_rx,g_ry,g_rz);
    var normalmatrix = normalMatrix(ml_matrix,true);
    gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(ml_matrix));
    gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalmatrix));
    send(g_materialAmbient, g_materialDiffuse, g_materialSpecular, g_materialShininess);
    
    if (null != sphere)
        sphere.render();
    
    
    requestAnimFrame( render );
}


function send(materialAmbient, materialDiffuse, materialSpecular, materialShininess)
{
    var newLightPosition = vec4( g_lightPosition[0],g_lightPosition[1],g_lightPosition[2],g_lightPosition[3]);
    
    newLightPosition[0] = 5.5*Math.sin(0.01*g_time);
    newLightPosition[2] = 5.5*Math.cos(0.01*g_time);
    
    g_time += 1;

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    
   
    
    gl.uniform4fv(materialAmbientProductLocation, flatten(ambientProduct));
    gl.uniform4fv(materialDiffuseProductLocation, flatten(diffuseProduct));
    gl.uniform4fv(materialSpecularProductLocation, flatten(specularProduct));
    gl.uniform4fv(lightLocation, flatten(newLightPosition));
    gl.uniform1f(materialShininessLocation, materialShininess);
    
}



var texSize = 64;

// Create a checkerboard pattern using floats

    
var image1 = new Array()
for (var i =0; i<texSize; i++)  
    image1[i] = new Array();
for (var i =0; i<texSize; i++) 
    for ( var j = 0; j < texSize; j++) 
        image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) 
    for (var j=0; j<texSize; j++)
    {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
        image1[i][j] = [c, c, c, 1];
    }
    

var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ ) 
    for ( var j = 0; j < texSize; j++ ) 
       for(var k =0; k<4; k++) 
            image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];
            
            
var emptyTexture1 = new Array()
for (var i =0; i<texSize; i++)  
    emptyTexture1[i] = new Array();
for (var i =0; i<texSize; i++) 
    for ( var j = 0; j < texSize; j++) 
        emptyTexture1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) 
    for (var j=0; j<texSize; j++)
    {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
        emptyTexture1[i][j] = [c, c, c, 1];
    }
    

var emptyTexture2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ ) 
    for ( var j = 0; j < texSize; j++ ) 
       for(var k =0; k<4; k++) 
            emptyTexture2[4*texSize*i+4*j+k] = 1*emptyTexture1[i][j][k];

function configureTexture(image, id = 0) 
{
    texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 + id);
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, 
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}


const MIN = 0;
const MAX = 1.0;
 
// http://actionsnippet.com/?p=475
function clamp(val, min = MIN, max = MAX)
{
    return Math.max(min, Math.min(max, val))
}


function createSphere()
{
    if (null != sphere)
    {
        sphere.destroy();
        sphere = null;
    }
    
    if (0 == g_textureMappingTypeValue)
    {
        sphere = new SphereTetrahedron(5);
        sphere.initSphere();
    }
    else
    {
        sphere = new Sphere(40,40,g_textureMappingTypeValue-1);
        sphere.initSphere();
    }
}


function SphereTetrahedron(numSubDivisions)
{   
    // normals of the sphere
    this.normals = [];
    // texture coordinates
    this.preUv = [];
    this.uv = [];
    // positions of the vertices
    this.positions = [];
    // number of subdivisions for the recursion
    this.numSubDivisions = numSubDivisions;    
    // number of vertices
    this.numVertices = 0;  
    
    this.finalVertices = [];
    
    this.vertexBuffer = 0;
        
        
    this.destroy = function()
    {
        gl.deleteBuffer(this.vertexBuffer);
        this.finalVertices = [];
    }
        
    // initialize the sphere geometry and initialize its buffers
    this.initSphere = function()
    { 
        this.generateSphereFromTetrahedron();
        this.buildFinalVertices();
        this.initSphereBuffers();
    }
    
    this.buildFinalVertices = function()
    {
        for (vIdx = 0; vIdx < this.positions.length; vIdx++)
        {
            this.finalVertices.push(this.positions[vIdx]);
            this.finalVertices.push(this.uv[vIdx]);
            this.finalVertices.push(this.normals[vIdx]);
        }
        this.positions = [];
        this.uv = [];
        this.normals = [];
    }
    
    // see https://www.siggraph.org/education/materials/HyperGraph/mapping/spheretx.htm
    this.computeUv = function(p,clip)
    {
        // x(theta,phi) = cos theta
        // y(theta,phi) = sin theta cos phi
        // z(theta,phi) = r sin theta sin phi
        // for pi >= theta >= - pi and pi >= phi >= -pi
        
        var x = p[0];
        var y = p[1];
        var z = p[2];
        
        var radius = length(p);
        
        var theta = Math.atan2(-z,x);
        var u = (theta + Math.PI) / (2.0 * Math.PI);
        var phi = Math.acos(-y / radius);
        var v = phi / Math.PI;

        if (clip && u < 0.1) 
        {
            u = 1.0;
        }
      
        this.uv.push(vec2(clamp(u),clamp(v)));        
    }
    
    // add vertex position to vertex list and add normal to normal list
    this.triangle = function (a, b, c)
    {
        var clip = false;
        // problems with texture
        if (((a[2] < 0.0 || b[2] < 0.0 || c[2] < 0.0) && (a[2] >= 0.0 || b[2] >= 0.0 || c[2] >= 0.0)) ) 
        {
            clip = true;
        }
    
    
        this.positions.push(a);
        this.normals.push(normalize(vec3(a[0],a[1],a[2])));
        this.computeUv(vec3(a[0],a[1],a[2]),clip);
        this.positions.push(b);
        this.normals.push(normalize(vec3(b[0],b[1],b[2])));
        this.computeUv(vec3(b[0],b[1],b[2]),clip);
        this.positions.push(c);
        this.normals.push(normalize(vec3(c[0],c[1],c[2])));
        this.computeUv(vec3(c[0],c[1],c[2]),clip);
        this.numVertices+=3;
    }
    
    // recursive subdivision of the triangles
    this.divideTriangle = function(a, b, c, count)
    {        
        if (count > 0) 
        {
            var ab = normalize(mix(a, b, 0.5), true);
            var ac = normalize(mix(a, c, 0.5), true);
            var bc = normalize(mix(b, c, 0.5), true);
            
            this.divideTriangle(a, ab, ac, count - 1);
            this.divideTriangle(ab, b, bc, count - 1);
            this.divideTriangle(bc, c, ac, count - 1);
            this.divideTriangle(ab, bc, ac, count - 1);
        }
        else 
        {
            this.triangle(a, b, c);
        }
    }
    
    // this function generates the sphere by recursive subdivision of a tetrahedron
    this.generateSphereFromTetrahedron = function()
    { 
        // points of the tetrahedron
        var va = vec4(0.0, 0.0, -1.0, 1);
        var vb = vec4(0.0, 0.942809, 0.333333, 1);
        var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
        var vd = vec4(0.816497, -0.471405, 0.333333, 1);
        
        this.divideTriangle(va, vb, vc, this.numSubDivisions);
        this.divideTriangle(vd, vc, vb, this.numSubDivisions);
        this.divideTriangle(va, vd, vb, this.numSubDivisions);
        this.divideTriangle(va, vc, vd, this.numSubDivisions);
    }
    
    // init sphere buffers
    this.initSphereBuffers = function()
    {        
        this.vertexBuffer = gl.createBuffer();       
        this.bind();
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.finalVertices), gl.STATIC_DRAW);
        
        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vUv);
        gl.enableVertexAttribArray(vNormal);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 9*4, 0*4);
        gl.vertexAttribPointer(vUv, 2, gl.FLOAT, false, 9*4, 4*4);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 9*4, 6*4);
        
        this.unbind();
    }
    
    // render the sphere
    this.render = function()
    {
        this.bind();
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
        //gl.drawArrays(gl.LINE_STRIP, 0, this.numVertices);
        this.unbind();
    }
    
    this.bind = function()
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    }
    
    this.unbind = function()
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}



function Sphere(latitudeBands, longitudeBands, typeOfMapping)
{   
    this.uv = 
    {
        spherical: [],
        planar: [],
        cylindrical: []
    };

    this.positions = [];
    this.normals = [];
    
    this.vertexArray = [];
    this.indexData = [];
    this.numVertices = 0;
    this.numIndices = 0;

    this.typeOfMapping = typeOfMapping;
    this.sphereRadius = 1.0
    this.latitudeBands = latitudeBands;
    this.longitudeBands = longitudeBands;
    
    this.indexBuffer = 0,
    this.vertexBuffer = 0;
        
    this.destroy = function()
    {
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);
        this.vertexArray = [];
        this.indexData = [];
        this.positions = [];
        this.normals = [];
    }
        
    this.initSphere = function()
    { 
        this.generateSphere();
        this.initSphereBuffers();      
    }
    
    this.generateSphere = function()
    { 
        this.numVertices = 0;      
                   
        for (var latNumber = 0; latNumber <= this.latitudeBands; ++latNumber) 
        {
            var theta = latNumber * Math.PI / this.latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);
            
            for (var longNumber = 0; longNumber <= this.latitudeBands; ++longNumber) 
            {                
                var phi = longNumber * 2 * Math.PI / this.latitudeBands;                
                var sinPhi = Math.sin(phi);                
                var cosPhi = Math.cos(phi);

                var x = Math.sin(phi) * Math.sin(theta);
                var y = cosTheta;
                var z = Math.cos(phi) * Math.sin(theta)

                this.vertexArray.push(vec4(x,y,z,1.0));
                
                if (0 == typeOfMapping)
                {
                    this.vertexArray.push(vec2(1 - (longNumber*1.0 / this.latitudeBands), 1 - (latNumber*1.0 / this.latitudeBands)));
                }
                else if (1 == typeOfMapping)
                {
                    this.vertexArray.push(vec2(x,y));
                }
                else if (2 == typeOfMapping)
                {
                    this.vertexArray.push(vec2(theta,phi));
                }
                else
                {
                    this.vertexArray.push(vec2(1 - (longNumber*1.0 / this.latitudeBands), 1 - (latNumber*1.0 / this.latitudeBands)));
                }
                
                this.vertexArray.push(normalize(vec3(x,y,z)));
                                
                this.numVertices ++;
            }
        }
        
        for (var latNumberI = 0; latNumberI < this.latitudeBands; ++latNumberI) 
        {
            for (var longNumberI = 0; longNumberI < this.latitudeBands; ++longNumberI) 
            {
                var first = (latNumberI * (this.latitudeBands+1)) + longNumberI;
                var second = first + this.latitudeBands + 1;
                this.indexData.push(first);
                this.indexData.push(second);
                this.indexData.push(first+1);

                this.indexData.push(second);
                this.indexData.push(second+1);
                this.indexData.push(first+1);  
                
                this.numIndices+=6;
            }
        }
        
        
        console.log(this.numVertices);
        console.log(this.numIndices);
    }
    
    this.initSphereBuffers = function()
    {        
        this.vertexBuffer = gl.createBuffer();       
        this.bind();
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertexArray), gl.STATIC_DRAW);
        
        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vUv);
        gl.enableVertexAttribArray(vNormal);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 9*4, 0);
        gl.vertexAttribPointer(vUv, 2, gl.FLOAT, false, 9*4, 4*4);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 9*4, 6*4);
        
        this.indexBuffer = gl.createBuffer();
        this.bindIndexBuffer();
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);

        this.unbindIndexBuffer();
        this.unbind();
    }
    
    this.render = function()
    {
        this.bind();
        //gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
        //console.log(flatten(this.vertexArray));
        this.bindIndexBuffer();
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        this.unbindIndexBuffer();
        this.unbind();
        
    }
    
    this.bind = function()
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    }
    
    this.bindIndexBuffer = function()
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    }
    
    this.unbind = function()
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    
    this.unbindIndexBuffer = function()
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}




















function handleRotation()
{
    // ------------------------------------------------------------------
    // color modifications
    var sliderX = document.getElementById("rx");
    var sliderY = document.getElementById("ry");
    var sliderZ = document.getElementById("rz");
    
    var rx = document.getElementById("RotationX");
    var ry = document.getElementById("RotationY");
    var rz = document.getElementById("RotationZ");    
    
    sliderX.onclick = function()
    {
        rx.value = sliderX.value;
        g_rx = rx.value;
    };
    
    sliderY.onclick = function()
    {
        ry.value = sliderY.value;
        g_ry = ry.value;
    };
    
    sliderZ.onclick = function()
    {
        rz.value = sliderZ.value;
        g_rz = rz.value;
    };
    
    rx.onkeyup = function()
    {
        if (-180 > rx.value)
            rx.value = -180;
        if (180 < rx.value)
            rx.value = 180;
        sliderX.value = rx.value;
        g_rx = rx.value;
    }
    
    ry.onkeyup = function()
    {
        if (-180 > ry.value)
            ry.value = -180;
        if (180 < ry.value)
            ry.value = 180;
        sliderY.value = ry.value;
        g_ry = ry.value;
    }
    
    rz.onkeyup = function()
    {
        if (-180 > rz.value)
            rz.value = -180;
        if (180 < rz.value)
            rz.value = 180;
        sliderZ.value = rz.value;
        g_rz = rz.value;
    }
    if (sphere != null)
        render();
    // ------------------------------------------------------------------
}