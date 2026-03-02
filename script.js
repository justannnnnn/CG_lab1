let gl;
let shaderProgram;

let triangleVertexPositionBuffer;
let triangleVertexColorBuffer;

let mvMatrix;
let perspectiveMatrix;
let squareVertexPositionBuffer;
let squareVertexColorBuffer;

const vsSource = `
attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 vColor;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vColor = aVertexColor;
}
`;

const fsSource = `
#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}
`;

function initWebGL(canvas) {
    gl = null;
    try {
        gl = canvas.getContext("webgl2") ||
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
    } catch (e) { }

    if (!gl) {
        alert("Unable to initialize WebGL.");
        gl = null;
    }
    return gl;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize shader program: " +
            gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader compile error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initBuffers() {
    const triPositions = [
        -0.8, -0.2, 0.0,
        -0.4, 0.4, 0.0,
        0.0, -0.2, 0.0
    ];
    const triColors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];

    triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triPositions), gl.STATIC_DRAW);

    triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triColors), gl.STATIC_DRAW);

    const squarePositions = [
        0.2, 0.4, 0.0,
        0.8, 0.4, 0.0,
        0.2, -0.2, 0.0,
        0.8, -0.2, 0.0
    ];
    const squareColors = [
        0.0, 0.8, 1.0, 1.0,
        0.0, 0.8, 1.0, 1.0,
        0.0, 0.8, 1.0, 1.0,
        0.0, 0.8, 1.0, 1.0
    ];

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squarePositions), gl.STATIC_DRAW);

    squareVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareColors), gl.STATIC_DRAW);
}

function loadIdentity() {
    mvMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.uPMatrix,
        false,
        perspectiveMatrix);
    gl.uniformMatrix4fv(shaderProgram.uMVMatrix,
        false,
        mvMatrix);
}

function drawScene() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    perspectiveMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    loadIdentity();
    setMatrixUniforms();

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);


    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function start() {

    const canvas = document.getElementById("glcanvas");
    gl = initWebGL(canvas);

    if (gl) {

        gl.viewport(0, 0,
            gl.canvas.width,
            gl.canvas.height);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        shaderProgram = initShaderProgram(gl,
            vsSource,
            fsSource);

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute =
            gl.getAttribLocation(shaderProgram,
                "aVertexPosition");
        gl.enableVertexAttribArray(
            shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexColorAttribute =
            gl.getAttribLocation(shaderProgram,
                "aVertexColor");
        gl.enableVertexAttribArray(
            shaderProgram.vertexColorAttribute);

        shaderProgram.uPMatrix =
            gl.getUniformLocation(shaderProgram,
                "uPMatrix");
        shaderProgram.uMVMatrix =
            gl.getUniformLocation(shaderProgram,
                "uMVMatrix");

        initBuffers();
        drawScene();
    }
}

window.onload = start;
