const canvas = document.getElementById("glcanvas");
canvas.width = 900;
canvas.height = 600;

const gl = canvas.getContext("webgl2");
if (!gl) alert("WebGL 2 not supported");

const vertShaderSrc = `#version 300 es
precision highp float;

layout(location=0) in vec3 inPosition;
layout(location=1) in vec4 inColor;
layout(location=2) in vec4 inStripColor;

uniform mat4 viewProjection;
uniform mat4 model;

out vec4 fragColor;
out vec3 vPosition;
out vec4 stripColor;

void main(){
    gl_Position = viewProjection * model * vec4(inPosition,1.0);
    fragColor = inColor;
    vPosition = inPosition;
    stripColor = inStripColor;
}
`;

const fragShaderSrc = `#version 300 es
precision highp float;

in vec4 fragColor;
in vec3 vPosition;
in vec4 stripColor;

out vec4 outColor;

void main(){
    float k = 10.0;
    float strip = floor(vPosition.x * k);
    if(mod(strip,2.0)==0.0)
        outColor = fragColor;
    else
        outColor = stripColor;
}
`;

function compileShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compileShader(vertShaderSrc, gl.VERTEX_SHADER));
gl.attachShader(program, compileShader(fragShaderSrc, gl.FRAGMENT_SHADER));
gl.linkProgram(program);
gl.useProgram(program);

const viewProjLoc = gl.getUniformLocation(program, "viewProjection");
const modelLoc = gl.getUniformLocation(program, "model");


function identity() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0
    ]);
}

function translate(x, y, z) {
    const m = identity();
    m[12] = x; m[13] = y; m[14] = z;
    return m;
}

function rotateY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
    ]);
}

function rotateX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1
    ]);
}

function multiply(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            out[j * 4 + i] = 0;
            for (let k = 0; k < 4; k++) {
                out[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k];
            }
        }
    }
    return out;
}

function createVAO(vertices, colors, stripColors, indices = null) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vboV = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vboV);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const vboC = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vboC);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

    const vboS = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vboS);
    gl.bufferData(gl.ARRAY_BUFFER, stripColors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

    let ibo = null;
    if (indices) {
        ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    gl.bindVertexArray(null);
    return { vao, ibo, count: indices ? indices.length : vertices.length / 3 };
}


const pentagonVerts = [];
const radius = 1;
for (let i = 0; i < 5; i++) {
    const angle = i * 2 * Math.PI / 5 - Math.PI / 2;
    pentagonVerts.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
    );
}
const pentagonVertices = new Float32Array(pentagonVerts);

const pentagonColors = new Float32Array(5 * 4);
for (let i = 0; i < 5; i++) {
    pentagonColors.set([0.8, 0.2, 0.2, 1], i * 4);
}
const pentagonVAO = createVAO(
    pentagonVertices,
    pentagonColors,
    pentagonColors
);


const cubeVertices = new Float32Array([
    -1, -1, 1,
    1, -1, 1,
    1, 1, 1,
    -1, 1, 1,

    1, -1, -1,
    -1, -1, -1,
    -1, 1, -1,
    1, 1, -1,

    -1, 1, 1,
    1, 1, 1,
    1, 1, -1,
    -1, 1, -1,

    -1, -1, -1,
    1, -1, -1,
    1, -1, 1,
    -1, -1, 1,

    1, -1, 1,
    1, -1, -1,
    1, 1, -1,
    1, 1, 1,

    -1, -1, -1,
    -1, -1, 1,
    -1, 1, 1,
    -1, 1, -1
]);

const cubeColors = new Float32Array((cubeVertices.length / 3) * 4);
for (let i = 0; i < cubeVertices.length / 3; i++) {
    cubeColors.set([0.2, 0.6, 1.0, 1], i * 4);
}

const cubeIndices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
]);

const cubeVAO = createVAO(cubeVertices, cubeColors, cubeColors, cubeIndices);

const squareVertices = new Float32Array([
    1, 1, 0,
    -1, 1, 0,
    1, -1, 0,
    -1, -1, 0
]);

const squareColors = new Float32Array(4 * 4);
for (let i = 0; i < 4; i++)
    squareColors.set([0.1, 0.1, 0.8, 1], i * 4);

const stripColors = new Float32Array(4 * 4);
for (let i = 0; i < 4; i++)
    stripColors.set([1, 1, 1, 1], i * 4);

const squareVAO = createVAO(squareVertices, squareColors, stripColors);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.2, 0.2, 0.2, 1);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

const proj = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
const view = translate(0, 0, -8);
const viewProj = multiply(proj, view);
gl.uniformMatrix4fv(viewProjLoc, false, viewProj);

let model = translate(-3, 0, 0);
gl.uniformMatrix4fv(modelLoc, false, model);
gl.bindVertexArray(pentagonVAO.vao);
gl.drawArrays(gl.TRIANGLE_FAN, 0, 5);

model = multiply(
    translate(0, 0, 0),
    multiply(rotateY(Math.PI / 6),
        rotateX(-Math.PI / 6))
);
gl.uniformMatrix4fv(modelLoc, false, model);
gl.bindVertexArray(cubeVAO.vao);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVAO.ibo);
gl.drawElements(gl.TRIANGLES, cubeVAO.count, gl.UNSIGNED_SHORT, 0);

model = translate(3, 0, 0);
gl.uniformMatrix4fv(modelLoc, false, model);
gl.bindVertexArray(squareVAO.vao);
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);