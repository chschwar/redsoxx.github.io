function computeNormal(a,b,c)
{
    // https://www.opengl.org/wiki/Calculating_a_Surface_Normal
    
    var u4 = subtract(b,a);
    var v4 = subtract(c,a);
    
    var u = vec3(u4[0],u4[1],u4[2]);
    var v = vec3(v4[0],v4[1],v4[2]);
    
    var n = cross(u,v);
    //console.log(n);
    return normalize( n );
}

function Cone(resolution)
{
    this.height = 2.0;
    this.radius = 1.0;
    this.resolution = resolution;
    
    this.vertexArray = [];
    this.indexData = [];
    this.numVertices = 0;
    this.numIndices = 0;
    
    this.indexBuffer = 0,
    this.vertexBuffer = 0;
        
    this.destroy = function()
    {
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);
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
        var positions = [];
        var normals = [];
        var uv = [];
    
        var step = (Math.PI * 2.0) / this.resolution;
        var angle = 0.0;
        
        // apex of the cone
        var vertex = vec4(0.0,this.height,0.0,1.0);
        positions.push(vertex);
        normals.push(vec3(0,0,0));
        uv.push(vec2(0,0));
        this.numVertices++;
        
        for (var i = 0; i < this.resolution; i++)
        {
            angle = step * i;
            var newVertex = vec4(
                this.radius * Math.cos(angle),
                0.0,
                this.radius * Math.sin(angle),
                1.0);
            
            positions.push(newVertex);
            normals.push(vec3(0,0,0));
            uv.push(vec2(0,0));
            this.numVertices++;
        }
        
        
        
        
        // define lateral surface of the cone
        for (var i = 0; i < this.resolution; i++) 
        {
            var first = 0;
            var second = 1 + (i % this.resolution);
            var third = 1 + ((i+1) % this.resolution);
            
            var a = positions[first];
            var b = positions[second];
            var c = positions[third];
            
            var normal = computeNormal(a,b,c);
            normals[first] = add(normals[first],normal);
            normals[second] = add(normals[second],normal);
            normals[third] = add(normals[third],normal);
        
            this.indexData.push(first);
            this.indexData.push(second);
            this.indexData.push(third);            
            this.numIndices += 3;
        }
        
        
        var vertexOffset = this.numVertices;
        var indexOffset = this.numIndices;
        
        // center bottom
        var newVertex = vec4(0.0,0.0,0.0,1.0);
        positions.push(newVertex);
        normals.push(vec3(0,0,0));
        uv.push(vec2(0,0));
        this.numVertices++;
        
        for (var i = 0; i < this.resolution; i++)
        {
            angle = step * i;
            var newVertex = vec4(
                this.radius * Math.cos(angle),
                0.0,
                this.radius * Math.sin(angle),
                1.0);
            
            positions.push(newVertex);
            normals.push(vec3(0,0,0));
            uv.push(vec2(0,0));
            this.numVertices++;
        }
        
        // bottom part of the cone
        for (var i = 0; i < this.resolution; i++) 
        {
            var first = vertexOffset;
            var second = 1 + (i % this.resolution) + vertexOffset;
            var third = 1 + ((i+1) % this.resolution) + vertexOffset;
            
            var a = positions[first];
            var b = positions[second];
            var c = positions[third];
            
            var normal = computeNormal(a,b,c);
            normals[first] = add(normals[first],normal);
            normals[second] = add(normals[second],normal);
            normals[third] = add(normals[third],normal);
        
            this.indexData.push(first);
            this.indexData.push(second);
            this.indexData.push(third);            
            this.numIndices += 3;
        }
        
        for (var i = 0; i < normals.length; ++i)
        {
            normals[i] = normalize(normals[i]);
            
            this.vertexArray.push(positions[i]);
            this.vertexArray.push(uv[i]);
            this.vertexArray.push(normals[i]);
        }
        uv = [];
        normals = [];
        positions = [];
        
        console.log(this.numIndices);
        console.log(this.numVertices);
    }
    
    this.initBuffers = function()
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