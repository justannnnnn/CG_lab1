const canvas = document.getElementById("glcanvas");
canvas.width = 1000;
canvas.height = 700;

const gl = canvas.getContext("webgl2");
if (!gl) alert("WebGL2 not supported");

const vs = `#version 300 es
precision highp float;
layout(location=0) in vec3 inPos;
layout(location=1) in vec4 inColor;

uniform mat4 viewProjection;
uniform mat4 model;

out vec4 vColor;

void main(){
    gl_Position=viewProjection*model*vec4(inPos,1.0);
    vColor=inColor;
}
`;

const fs = `#version 300 es
precision highp float;
in vec4 vColor;
out vec4 outColor;
void main(){
    outColor=vColor;
}
`;

function compile(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
}

const prog = gl.createProgram();
gl.attachShader(prog, compile(vs, gl.VERTEX_SHADER));
gl.attachShader(prog, compile(fs, gl.FRAGMENT_SHADER));
gl.linkProgram(prog);
gl.useProgram(prog);

const viewProjLoc = gl.getUniformLocation(prog, "viewProjection");
const modelLoc = gl.getUniformLocation(prog, "model");

function identity() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

function perspective(fov, a, n, f) {
    const t = 1 / Math.tan(fov / 2);
    const nf = 1 / (n - f);
    return new Float32Array([
        t / a, 0, 0, 0,
        0, t, 0, 0,
        0, 0, (f + n) * nf, -1,
        0, 0, (2 * f * n) * nf, 0
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

function multiply(a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            o[j * 4 + i] = 0;
            for (let k = 0; k < 4; k++)
                o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k];
        }
    }
    return o;
}

const cubeVerts = new Float32Array([
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1,
    -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,
    -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
    1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1,
    -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1
]);

const cubeInd = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
]);

function createCube(color) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const colors = new Float32Array((cubeVerts.length / 3) * 4);
    for (let i = 0; i < cubeVerts.length / 3; i++)
        colors.set(color, i * 4);

    const cbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeInd, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    return { vao, count: cubeInd.length };
}

const leftCube = createCube([0.7, 0.7, 0.7, 1]);
const centerBottom = createCube([1.0, 0.84, 0.0, 1]);
const centerTop = createCube([1.0, 0.84, 0.0, 1]);
const rightCube = createCube([0.8, 0.5, 0.2, 1]);

const cubes = [
    leftCube,
    centerBottom,
    centerTop,
    rightCube
];


gl.viewport(0, 0, canvas.width, canvas.height);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1);

const proj = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
const view = translate(0, 0, -20);
gl.uniformMatrix4fv(viewProjLoc, false, multiply(proj, view));

let cubeRotation = 0;
let localPedestalRotation = 0;
let globalPedestalRotation = 0;

window.addEventListener("keydown", (e) => {
    if (e.key === "q") cubeRotation += 0.1;
    if (e.key === "e") cubeRotation -= 0.1;

    if (e.key === "a") localPedestalRotation += 0.1;
    if (e.key === "d") localPedestalRotation -= 0.1;

    if (e.key === "z") globalPedestalRotation += 0.1;
    if (e.key === "c") globalPedestalRotation -= 0.1;

    draw();
});

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const globalRot = rotateY(globalPedestalRotation);

    const pedestalTranslation = translate(5, 0, 0);
    const localRot = rotateY(localPedestalRotation);

    const pedestalMatrix =
        multiply(
            globalRot,
            multiply(
                pedestalTranslation,
                localRot
            )
        );

    const positions = [
        translate(-4, 0, 0),
        translate(0, 0, 0),
        translate(0, 2, 0),
        translate(4, 0, 0)
    ];

    for (let i = 0; i < 4; i++) {

        const cubeLocalRot = rotateY(cubeRotation);

        const model =
            multiply(
                pedestalMatrix,
                multiply(
                    positions[i],
                    cubeLocalRot
                )
            );

        gl.uniformMatrix4fv(modelLoc, false, model);
        gl.bindVertexArray(cubes[i].vao);
        gl.drawElements(gl.TRIANGLES, cubes[i].count, gl.UNSIGNED_SHORT, 0);
    }
}

draw();