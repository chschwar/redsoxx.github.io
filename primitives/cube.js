function computeNormal2(a,b,c)
{
    var t1 = subtract(b, a);
    var t2 = subtract(c, b);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    return normal;
}

function Cube()
{   
    this.vertexArray = [];
    this.indexData = [];
    this.numVertices = 0;
    this.numIndices = 0;
    
    this.indexBuffer = 0,
    this.vertexBuffer = 0;

    this.destroy = function()
    {
        if (0 != this.vertexBuffer && 0 != this.indexBuffer)
        {
            gl.deleteBuffer(this.vertexBuffer);
            gl.deleteBuffer(this.indexBuffer);
        }
        this.vertexBuffer = 0;
        this.indexBuffer = 0;
        this.vertexArray = [];
        this.indexData = [];
    }
    
    this.initialize = function()
    { 
        this.generateVertices();
        this.initBuffers();      
    }
    
    this.generateVertices = function()
    {                 
        
        var positions = [
            // Front face
            vec4(-1.0, -1.0, 1.0, 1.0),
            vec4(1.0, -1.0,  1.0, 1.0),
            vec4(1.0, 1.0, 1.0, 1.0),
            vec4(-1.0, 1.0, 1.0, 1.0),
            
            // Back face
            vec4(-1.0, -1.0, -1.0, 1.0),
            vec4(-1.0, 1.0, -1.0, 1.0),
            vec4(1.0, 1.0, -1.0, 1.0),
            vec4(1.0, -1.0, -1.0, 1.0),
            
            // Top face
            vec4(-1.0,  1.0, -1.0, 1.0),
            vec4(-1.0,  1.0,  1.0, 1.0),
            vec4(1.0,  1.0,  1.0, 1.0),
            vec4(1.0,  1.0, -1.0, 1.0),

            // Bottom face
            vec4(-1.0, -1.0, -1.0, 1.0),
            vec4(1.0, -1.0, -1.0, 1.0),
            vec4(1.0, -1.0,  1.0, 1.0),
            vec4(-1.0, -1.0,  1.0, 1.0),

            // Right face
            vec4(1.0, -1.0, -1.0, 1.0),
            vec4(1.0,  1.0, -1.0, 1.0),
            vec4(1.0,  1.0,  1.0, 1.0),
            vec4(1.0, -1.0,  1.0, 1.0),

            // Left face
            vec4(-1.0, -1.0, -1.0, 1.0),
            vec4(-1.0, -1.0,  1.0, 1.0),
            vec4(-1.0,  1.0,  1.0, 1.0),
            vec4(-1.0,  1.0, -1.0, 1.0)
        ];

        var normals = [];
        for (var idx = 0; idx < 24; idx++)
        {
            normals.push(vec3(0,0,0));
        }
        
        var uv = [
          // Front face
          vec2(0.0, 0.0),
          vec2(1.0, 0.0),
          vec2(1.0, 1.0),
          vec2(0.0, 1.0),

          // Back face
          vec2(0.0, 0.0),
          vec2(1.0, 0.0),
          vec2(1.0, 1.0),
          vec2(0.0, 1.0),

          // Top face
          vec2(0.0, 0.0),
          vec2(1.0, 0.0),
          vec2(1.0, 1.0),
          vec2(0.0, 1.0),

          // Bottom face
          vec2(0.0, 0.0),
          vec2(1.0, 0.0),
          vec2(1.0, 1.0),
          vec2(0.0, 1.0),

          // Right face
          vec2(0.0, 0.0),
          vec2(1.0, 0.0),
          vec2(1.0, 1.0),
          vec2(0.0, 1.0),

          // Left face
          vec2(0.0, 0.0),
          vec2(1.0, 0.0),
          vec2(1.0, 1.0),
          vec2(0.0, 1.0)
        ];
        
        this.indexData = [
            0,1,2, 0,2,3,
            4,5,6, 4,6,7,
            8,9,10, 8,10,11,
            12,13,14, 12,14,15,
            16,17,18, 16,18,19,
            20,21,22, 20,22,23
        ];
        
        
        
        for (var idx = 0; idx < this.indexData.length; idx+=6) 
        {
            var first = this.indexData[idx];
            var second = this.indexData[idx+1]
            var third = this.indexData[idx+2]
            var fourth = this.indexData[idx+3];
            var fifth = this.indexData[idx+4];
            var sixth = this.indexData[idx+5];
            
            {
                var a = positions[first];
                var b = positions[second];
                var c = positions[third];
                
                var normal = computeNormal(a,b,c);
                normals[first] = add(normals[first],normal);
                normals[second] = add(normals[second],normal);
                normals[third] = add(normals[third],normal);
            }
            {
                var a = positions[fourth];
                var b = positions[fifth];
                var c = positions[sixth];
                
                var normal = computeNormal(a,b,c);
                normals[fourth] = add(normals[fourth],normal);
                normals[fifth] = add(normals[fifth],normal);
                normals[sixth] = add(normals[sixth],normal);
            }
            
            this.numIndices+=6;
        }
        
        for (var i = 0; i < normals.length; ++i)
        {
            normals[i] = normalize(normals[i]);
            
            this.vertexArray.push(positions[i]);
            this.vertexArray.push(uv[i]);
            this.vertexArray.push(normals[i]);
            
            //console.log(normals[i]);
        }
        
        uv = [];
        normals = [];
        positions = [];
        
        //console.log(this.numIndices);
        //console.log(this.numVertices);
    }
    
    this.initBuffers = function()
    {        
        this.vertexBuffer = gl.createBuffer();       
        this.bind();
        this.indexBuffer = gl.createBuffer();
        this.bindIndexBuffer();        
        this.unbindIndexBuffer();
        this.unbind();
    }
    
    this.render = function()
    {
        this.bind();
        this.bindIndexBuffer();
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        this.unbindIndexBuffer();
        this.unbind();
        
    }
    
    this.enableAttributes = function()
    {
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertexArray), gl.STATIC_DRAW);        
        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vUv);
        gl.enableVertexAttribArray(vNormal);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 9*4, 0);
        gl.vertexAttribPointer(vUv, 2, gl.FLOAT, false, 9*4, 4*4);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 9*4, 6*4);
    }
    
    this.drawElementArrayBuffer = function()
    {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
    }
    
    
    this.renderDump = function()
    {
        this.bind();
        this.enableAttributes();
        this.bindIndexBuffer();
        this.drawElementArrayBuffer();
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