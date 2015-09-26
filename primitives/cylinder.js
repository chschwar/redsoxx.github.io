function Cylinder(tesselationFactor, noTop = false, noBottom = false)
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
    
    this.noTop = noTop;
    this.noBottom = noBottom;

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
        var normals = [];
        var positions = [];
        var uv = [];
    
        var step = (Math.PI * 2.0) / this.resolution;
    
    
        for (var i = 0; i <= this.resolution; i++) 
        {
            u = i*step;
            var c = Math.cos(u);
            var s = Math.sin(u);
            
            positions.push(
                vec4(
                    c*this.radius,
                    s*this.radius,
                    -this.height/2,
                    1.0
                )
            );
            normals.push(
                vec3(
                    c,
                    s,
                    0
                )
            );            
            uv.push(vec2(i/this.resolution, 0));
            
            positions.push(
                vec4(
                    c*this.radius,
                    s*this.radius,
                    this.height/2,
                    1.0
                )
            );
            normals.push(
                vec3(
                    c,
                    s,
                    0
                )
            );            
            uv.push(vec2(i/this.resolution, 1));
        }
        for (var i = 0; i < this.resolution; i++) 
        {
            this.indexData.push(2*i);
            this.indexData.push(2*i+3);
            this.indexData.push(2*i+1);
            this.indexData.push(2*i);
            this.indexData.push(2*i+2);
            this.indexData.push(2*i+3);
        }
    
    
        var startIndex = positions.length;
        if (!this.noBottom) 
        {
            positions.push(
                vec4(
                    0,
                    0,
                    -this.height/2,
                    1.0
                )
            );
            normals.push(
                vec3(
                    0,
                    0,
                    -1
                )
            );            
            uv.push(vec2(0.5,0.5));
        
            
            for (var i = 0; i <= this.resolution; i++) 
            {
                var u = 2*Math.PI - i*step;
                var c = Math.cos(u);
                var s = Math.sin(u);
                
                positions.push(
                    vec4(
                        c*this.radius,
                        s*this.radius,
                        -this.height/2,
                        1.0
                    )
                );
                normals.push(
                    vec3(
                        0,
                        0,
                        -1
                    )
                );            
                uv.push(vec2(0.5 - 0.5*c,0.5-0.5*s));
                
            }
            for (var i = 0; i < this.resolution; i++) 
            {
                this.indexData.push(startIndex);
                this.indexData.push(startIndex + i + 1);
                this.indexData.push(startIndex + i + 2);
            }
        }
        startIndex = positions.length;
        if (!this.noTop) 
        {
            positions.push(
                vec4(
                    0,
                    0,
                    this.height/2,
                    1.0
                )
            );
            normals.push(
                vec3(
                    0,
                    0,
                    1
                )
            );            
            uv.push(vec2(0.5,0.5));
        
            
            for (var i = 0; i <= this.resolution; i++) 
            {
                var u = i*step;
                var c = Math.cos(u);
                var s = Math.sin(u);
                
                positions.push(
                    vec4(
                        c*this.radius,
                        s*this.radius,
                        this.height/2,
                        1.0
                    )
                );
                normals.push(
                    vec3(
                        0,
                        0,
                        1
                    )
                );            
                uv.push(vec2(0.5 + 0.5*c,0.5+0.5*s));
                
            }
            for (var i = 0; i < this.resolution; i++) 
            {
                this.indexData.push(startIndex);
                this.indexData.push(startIndex + i + 1);
                this.indexData.push(startIndex + i + 2);
            }
        }
        this.numIndices = this.indexData.length;
        this.numVertices = positions.length;
    
    
    
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