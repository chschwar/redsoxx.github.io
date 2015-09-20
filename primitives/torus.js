/**
 * Create a model of a torus (surface of a doughnut).  The z-axis goes through the doughnut hole,
 * and the center of the torus is at (0,0,0).
 * @param outerRadius the distance from the center to the outside of the tube, 0.5 if not specified.
 * @param innerRadius the distance from the center to the inside of the tube, outerRadius/3 if not
 *    specified.  (This is the radius of the doughnut hole.)
 * @param slices the number of lines of longitude, default 32.  These are slices parallel to the
 * z-axis and go around the tube the short way (through the hole).
 * @param stacks the number of lines of latitude plus 1, default 16.  These lines are perpendicular
 * to the z-axis and go around the tube the long way (arouind the hole).
 */
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

function Torus(outerRadius, innerRadius, slices, stacks)
{
    this.slices = slices;
    this.stacks = stacks;
    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;
    
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
        var positions = [];
        var normals = [];
        var uv = [];
        
        var du = 2*Math.PI/this.slices;
        var dv = 2*Math.PI/this.stacks;
        var centerRadius = (this.innerRadius+this.outerRadius)/2;
        var tubeRadius = this.outerRadius - centerRadius;
        var i,j,u,v,cx,cy,sin,cos,x,y,z;
        var indexV = 0;
        var indexT = 0;
    
        for (j = 0; j <= this.stacks; j++) 
        {
            v = -Math.PI + j*dv;
            cos = Math.cos(v);
            sin = Math.sin(v);
            for (i = 0; i <= this.slices; i++) 
            {
                u = i*du;
                cx = Math.cos(u);
                cy = Math.sin(u);
                x = cx*(centerRadius + tubeRadius*cos);
                y = cy*(centerRadius + tubeRadius*cos);
                z = sin*tubeRadius;
                positions.push(vec4(x,y,z,1.0));
                normals.push(vec3(cx*cos,cy*cos,sin));
                uv.push(vec2(i/slices,j/stacks));
                this.numVertices++;
            } 
        }
        this.numIndices = 0;
        for (j = 0; j < this.stacks; j++) 
        {
            var row1 = j*(this.slices+1);
            var row2 = (j+1)*(this.slices+1);
            for (i = 0; i < this.slices; i++) 
            {
                this.indexData.push(row1 + i);
                this.indexData.push(row2 + i + 1);
                this.indexData.push(row2 + i);
                this.indexData.push(row1 + i);
                this.indexData.push(row1 + i + 1);
                this.indexData.push(row2 + i + 1);
                this.numIndices+=6;
            }
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