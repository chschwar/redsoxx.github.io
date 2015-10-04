function DirectionalLight()
{
    this.position = vec4(0.0, 0.0, -3.0, 0.0 );
    this.ambientLight = vec4(0.4, 0.4, 0.4, 1.0 );
    this.diffuseLight = vec4( 1.0, 1.0, 1.0, 1.0 );
    this.specularLight = vec4( 1.0, 1.0, 1.0, 1.0 );
    this.direction = vec4(0,0,0,1);
    
    
    this.setPosition = function(position)
    {
        this.position[0] = position[0];
        this.position[1] = position[1];
        this.position[2] = position[2];
        this.position[3] = position[3];
    }
    
    this.getPosition = function()
    {
        return this.position;
    }
    
    this.setDirection = function(direction)
    {
        this.direction[0] = direction[0];
        this.direction[1] = direction[1];
        this.direction[2] = direction[2];
        this.direction[3] = direction[3];
    }
    
    this.getDirection = function()
    {
        return this.direction;
    }
    
    this.setAmbientLight = function(ambientLight)
    {
        this.ambientLight[0] = ambientLight[0];
        this.ambientLight[1] = ambientLight[1];
        this.ambientLight[2] = ambientLight[2];
        this.ambientLight[3] = ambientLight[3];
    }
    
    this.getAmbientLight = function()
    {
        return this.ambientLight;
    }
    
    this.setDiffuseLight = function(diffuseLight)
    {
        this.diffuseLight[0] = diffuseLight[0];
        this.diffuseLight[1] = diffuseLight[1];
        this.diffuseLight[2] = diffuseLight[2];
        this.diffuseLight[3] = diffuseLight[3];
    }
    
    this.getDiffuseLight = function()
    {
        return this.diffuseLight;
    }
    
    this.setSpecularLight = function(specularLight)
    {
        this.specularLight[0] = specularLight[0];
        this.specularLight[1] = specularLight[1];
        this.specularLight[2] = specularLight[2];
        this.specularLight[3] = specularLight[3];
    }
    
    this.getSpecularLight = function()
    {
        return this.specularLight;
    }

}