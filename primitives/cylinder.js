function Cylinder(tesselationFactor)
{   
    this.height = 1.0;
    this.radius = 1.0;
    this.resolution = tesselationFactor;
    
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
        var normals = [];
        var positions = [];
        var uv = [];
    
        // compute the upper part of the cylinder
        positions.push(vec4(0, this.height, 0, 1));  // position
        uv.push(vec2(0, 0));                          // uv
        normals.push(vec3(0, 0, 0));                       // normal
        this.numVertices++;
                
        var numSteps = this.resolution;
        var step = (Math.PI * 2.0) / this.resolution;
                
        for (var idx = 0; idx < this.resolution; idx++) 
        {
            var angle = step * idx;
            positions.push(
                vec4(Math.cos(angle) * this.radius, this.height, Math.sin(angle) * this.radius, 1));
            uv.push(vec2(0, 0));       // uv
            normals.push(vec3(0, 0, 0));    // normal
            this.numVertices++;
            
        }
        
        for (var idx = 0; idx < this.resolution; idx++) 
        {
            var first = 0;
            var second = 1 + idx;
            var third = 1 + ((idx + 1) % this.resolution);
            
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
            this.numIndices+=3;
        }
        
        var indexOffset = this.numVertices;
        
        
        // lower part
        positions.push(vec4(0, 0, 0, 1));  // position
        uv.push(vec2(0, 0));        // uv
        normals.push(vec3(0, 0, 0));     // normal
        this.numVertices++;
        
        for (var idx = 0; idx < this.resolution; idx++) 
        {
            var angle = step * idx;
            positions.push(
                vec4(Math.cos(angle) * this.radius, 0, Math.sin(angle) * this.radius, 1));
            uv.push(vec2(0, 0));       // uv
            normals.push(vec3(0, 0, 0));    // normal
            this.numVertices++;
        }
        
        // bottom of the cylinder
        for (var idx = 0; idx < this.resolution; idx++)
        {
            var first = indexOffset;
            var second = (1 + indexOffset) + idx;
            var third = (1 + indexOffset) + ((idx + 1) % this.resolution);
            
            var a = positions[third];
            var b = positions[second];
            var c = positions[first];
            
            var normal = computeNormal(a,b,c);
            normals[first] = add(normals[first],normal);
            normals[second] = add(normals[second],normal);
            normals[third] = add(normals[third],normal);
            
            this.indexData.push(third);
            this.indexData.push(second);
            this.indexData.push(first);
            this.numIndices+=3;
        }
        indexOffset = this.numVertices;
        
        // the side of the cylinder
        
        // top
        for (var idx = 0; idx < this.resolution; idx++) 
        {
            var angle = step * idx;
            positions.push(
                vec4(Math.cos(angle) * this.radius, this.height, Math.sin(angle) * this.radius, 1));
            uv.push(vec2(0, 0));       // uv
            normals.push(vec3(0,0,0));
            this.numVertices++;
        }
        
        // bottom
        for (var idx = 0; idx < this.resolution; idx++) 
        {
            var angle = step * idx;
            positions.push(
                vec4(Math.cos(angle) * this.radius, 0, Math.sin(angle) * this.radius, 1));
            uv.push(vec2(0, 0));       // uv
            normals.push(vec3(0,0,0)); 
            this.numVertices++;            
        }
        
        
        for (var idx = 0; idx < this.resolution; idx++) 
        {
            var first = indexOffset + idx;
            var second = indexOffset + this.resolution + idx;
            var third = indexOffset + this.resolution + (idx+1)%this.resolution;
            var fourth = third;
            var fifth = indexOffset + (idx+1)%this.resolution;
            var sixth = first;
        
        
            this.indexData.push(first);
            this.indexData.push(second);
            this.indexData.push(third);
            this.indexData.push(fourth);
            this.indexData.push(fifth);
            this.indexData.push(sixth);
            
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