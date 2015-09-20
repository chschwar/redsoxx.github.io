function Sphere(latitudeBands, longitudeBands, typeOfMapping)
{   
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
        this.numVertices = 0;      
                   
        for (var latNumber = 0; latNumber <= this.latitudeBands; ++latNumber) 
        {
            for (var longNumber = 0; longNumber <= this.latitudeBands; ++longNumber) 
            {
                var theta = latNumber * Math.PI / this.latitudeBands;
                var phi = longNumber * 2 * Math.PI / this.latitudeBands;
                var sinTheta = Math.sin(theta);
                var sinPhi = Math.sin(phi);
                var cosTheta = Math.cos(theta);
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


