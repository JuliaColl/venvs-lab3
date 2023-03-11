

function FXSSAO()
{
    this.properties = {
        enable: false,
        blur: true,
        radius: 1.25,
        bias: 0.001,
        max_dist: 5,
        min_dist: 0.025,
        power: 1
    };

	this.kernel = FXSSAO.generateSampleKernel( 64 );
	if(!FXSSAO.noise_texture)
		FXSSAO.noise_texture = FXSSAO.generateNoiseTexture( 4 );

    this.uniforms = {
        u_samples: this.kernel,
        u_radius: this.properties.radius,
        u_bias: this.properties.bias,
        u_max_dist: this.properties.max_dist,
        u_min_dist: this.properties.min_dist,
        u_ao_power: this.properties.power,
	    u_iresolution: vec2.create(),
		u_noise_scale: vec2.create(),
		u_invvp: mat4.create(),
		u_linear_depth: 0
    };
}

FXSSAO.prototype.getShader = function()
{
    if (this.shader)
        return this.shader;
    this.shader = gl.shaders["ssao"];
    return this.shader;
};

FXSSAO.prototype.applyFX = function( color_texture, normal_texture, depth_texture, camera, output_texture )
{
	if(!depth_texture)
		throw("depth texture missing");

	if(!output_texture)
		output_texture = new GL.Texture( depth_texture.width, depth_texture.height, { format: gl.RGB } );

	if(!color_texture)
		color_texture = GL.Texture.getWhiteTexture();

    var shader = this.getShader();
	if(!shader)
	{
		color_texture.copyTo(output_texture);
		return output_texture;
	}

	var uniforms = this.uniforms;

    uniforms.u_radius = this.properties.radius;
    uniforms.u_bias = this.properties.bias;
    uniforms.u_max_dist = this.properties.max_dist;
	uniforms.u_min_dist = this.properties.min_dist;
	uniforms.u_ao_power = this.properties.power;

    uniforms[ "u_color_texture" ] = color_texture.bind(0);
    uniforms[ "u_normal_texture" ] = normal_texture.bind(1);
    uniforms[ "u_depth_texture" ] = depth_texture.bind(2);
    uniforms[ "u_noise_texture" ] = FXSSAO.noise_texture.bind(3);

	var invvp = uniforms["u_invvp"];
    mat4.invert( invvp, camera.viewprojection_matrix )

    uniforms["u_projection"] = camera.projection_matrix;
    uniforms["u_view"] = camera.view_matrix;
    uniforms["u_near"] = camera.near;
    uniforms["u_far"] = camera.far;
	uniforms["u_linear_depth"] = camera.type == RD.Camera.PERSPECTIVE ? 0 : 1;
    uniforms["u_iresolution"][0] = 1.0 / output_texture.width;
	uniforms["u_iresolution"][1] = 1.0 / output_texture.height;
	uniforms["u_noise_scale"][0] = output_texture.width / 4;
	uniforms["u_noise_scale"][1] = output_texture.height / 4;
    // Render result texture
    output_texture.drawTo(function(){
        gl.disable( gl.DEPTH_TEST );
        gl.disable( gl.BLEND );
        shader.uniforms( uniforms ).draw( GL.Mesh.getScreenQuad() );
    });

    // Apply additional fx to resulting texture
    if( this.properties.blur )
        output_texture.applyBlur( 0.5, 0.5 , 1 );

	return output_texture;
}

FXSSAO.lerp = function(a,b,f) { return a + (b-a) * f; }

FXSSAO.generateSampleKernel = function( kernelSize )
{
	var kernel = [];

    for (var i = 0; i < kernelSize; i++)
    {
        var sample = vec3.create();
        sample[0] = (Math.random() * 2) - 1;    // -1 to 1
        sample[1] = (Math.random() * 2) - 1;    // -1 to 1
        sample[2] = Math.random();              // 0 to 1  -> hemisphere
        
        sample = vec3.normalize(sample, sample);
        sample = vec3.scale(sample, sample, Math.random());

        // give more weights to closer samples 
        var scale = i / kernelSize;
        scale = FXSSAO.lerp(0.1, 1.0, scale * scale);
        sample = vec3.scale(sample, sample, scale);

        kernel.push( sample );
    }

	return GL.linearizeArray(kernel);
}

FXSSAO.generateNoiseTexture = function( noise_size )
{
    var size = noise_size * noise_size;
    
    var data = new Float32Array(size * 3);
    for (var i = 0; i < size; i+=3)
    {
        data[i] = (Math.random());             // -1 to 1 -> transform in shader
        data[i+1] = (Math.random());             // -1 to 1 -> transform in shader
        data[i+2] = 0;                          // 0 rotate around Z
    }

    var options = {
        type: GL.FLOAT,
        format: GL.RGB,
        pixel_data: data,
        filter: gl.NEAREST,
        wrap: gl.REPEAT,
        anisotropic: 1
    }

    return new GL.Texture(noise_size, noise_size, options);
}

/*
\ssao.fs

#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

precision highp float;
uniform mat4 u_projection;
uniform vec2 u_resolution;
uniform mat4 u_invvp;
uniform mat4 u_view;
uniform float u_near;
uniform float u_far;

uniform sampler2D u_color_texture;
uniform sampler2D u_normal_texture;
uniform sampler2D u_depth_texture;
uniform sampler2D u_noise_texture;

uniform vec3 u_samples[64];
uniform float u_radius;
uniform float u_bias;
uniform float u_max_dist;
uniform float u_min_dist;
uniform float u_ao_power;

varying vec2 v_coord;

float readDepth(sampler2D depthMap, vec2 coord) {
	float z_b = texture2D(depthMap, coord).r;
	float z_n = 2.0 * z_b - 1.0;
	float z_e = 2.0 * u_near * u_far / (u_far + u_near - z_n * (u_far - u_near));
	return z_e;
}

vec2 viewSpaceToScreenSpaceTexCoord(vec3 p) {
	vec4 projectedPos = u_projection * vec4(p, 1.0);
	vec2 ndcPos = projectedPos.xy / projectedPos.w; //normalized device coordinates
	vec2 coord = ndcPos * 0.5 + 0.5;
	return coord;
}

vec3 getPositionFromDepth(float depth, vec2 uvs) {

	depth = depth * 2.0 - 1.0;
	vec2 pos2D = uvs * 2.0 - vec2(1.0);
	vec4 pos = vec4( pos2D, depth, 1.0 );
	pos = u_invvp * pos;
	pos.xyz = pos.xyz / pos.w;

	return pos.xyz;
}

void main() {
	
	vec2 coord = gl_FragCoord.xy / u_resolution;

	// Texture Maps
	vec4 colorMap = texture2D( u_color_texture, coord );
	vec4 depthMap = texture2D( u_depth_texture, coord);
	vec4 normalMap = texture2D( u_normal_texture, coord);
	vec3 normal    = normalize(normalMap.xyz * 2. - 1.);
	
	// Properties and depth
	float depth = texture2D( u_depth_texture, coord ).x;

	// Vectors
	normal = (u_view * vec4(normal, 0.0) ).xyz;
	vec3 position = getPositionFromDepth(depth, coord);
	position =  (u_view * vec4(position, 1.0) ).xyz;
	
	// SSAO

	float width = u_resolution.x;
	float height = u_resolution.y;

	vec2 noiseScale = vec2(width/4.0, height/4.0); 
	vec3 randomVec = texture2D(u_noise_texture, coord * noiseScale).xyz * 2.0 - vec3(1.0);
	vec3 tangent   = normalize(randomVec - normal * dot(randomVec, normal));
	vec3 bitangent = cross(normal, tangent);
	mat3 TBN       = mat3(tangent, bitangent, normal);  

	float radius = u_radius;
	float bias = u_bias;
	float occlusion = 0.0;

	if(depth == 1.0) 
	{
		occlusion = 1.0;
	}
	else
	{
		for(int i = 0; i < 64; ++i)
		{
			// get sample position
			vec3 sample = TBN * u_samples[i]; // From tangent to view-space
			sample = position + sample * radius;
			
			// transform to screen space 
			vec2 offset = viewSpaceToScreenSpaceTexCoord(sample);
			float sampleDepth = readDepth(u_depth_texture, offset);

			if( abs( (-sample.z) - sampleDepth ) > u_max_dist )
			continue;

			if( abs( (-sample.z) - sampleDepth ) < u_min_dist )
			continue;

			float rangeCheck =  smoothstep(0.0, 1.0, radius / abs((-sample.z) - sampleDepth));
			occlusion += (sampleDepth <= -sample.z ? 1.0 : 0.0) * rangeCheck;
		} 

		occlusion *= u_ao_power;
		occlusion = 1.0 - (occlusion / 64.0);
	}

	gl_FragColor = vec4(vec3(occlusion), 1.0);
}
*/

