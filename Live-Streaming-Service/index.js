import http from 'http';
import path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import express from 'express';
import { Server as SocketIO } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

app.use(express.static(path.resolve('./public')));

io.on('connection', (socket) => {
  console.log('Socket Connected', socket.id);

  let ffmpegProcess;

  // Start-stream event to start FFmpeg with the provided RTMP URL
  socket.on('start-stream', ({ rtmpUrl }) => {
    console.log('Starting stream to:', rtmpUrl);

    if (!rtmpUrl) {
      console.error('RTMP URL is required!');
      socket.emit('error', 'RTMP URL is required!');
      return;
    }

    const options = [
      '-i',
      '-',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-r', `${25}`,
      '-g', `${25 * 2}`,
      '-keyint_min', 25,
      '-crf', '25',
      '-pix_fmt', 'yuv420p',
      '-sc_threshold', '0',
      '-profile:v', 'main',
      '-level', '3.1',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', 128000 / 4,
      '-f', 'flv',
      rtmpUrl, // Dynamic RTMP URL
    ];

    ffmpegProcess = spawn('ffmpeg', options);

    ffmpegProcess.stdout.on('data', (data) => {
      console.log(`ffmpeg stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error(`ffmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`ffmpeg process exited with code ${code}`);
      ffmpegProcess = null;
    });

    ffmpegProcess.on('error', (err) => {
      console.error('Error spawning FFmpeg:', err);
      socket.emit('error', 'Failed to start FFmpeg process.');
    });

    console.log('FFmpeg process started.');
  });

  // Stream-data event to send binary stream to FFmpeg
  socket.on('stream-data', (stream) => {
    if (!ffmpegProcess) {
      console.error('FFmpeg process is not running.');
      socket.emit('error', 'FFmpeg process is not running.');
      return;
    }

    console.log('Binary Stream Incoming...');
    ffmpegProcess.stdin.write(stream, (err) => {
      if (err) {
        console.error('Error writing to FFmpeg stdin:', err);
      }
    });
  });

  // Stop-stream event to terminate FFmpeg process
  socket.on('stop-stream', async() => {

      try{

        await axios.delete('http://host.docker.internal:8080/api/livestream/delete');

    if (ffmpegProcess) {
      ffmpegProcess.stdin.end();
      ffmpegProcess.kill('SIGTERM');
      ffmpegProcess = null;
      console.log('FFmpeg process terminated.');
    } else {
      console.warn('No active FFmpeg process to stop.');
    }
  }catch(err){
      console.log(err);
  }
  });

  socket.on('disconnect', () => {
    console.log('Socket Disconnected:', socket.id);
    if (ffmpegProcess) {
      ffmpegProcess.stdin.end();
      ffmpegProcess.kill('SIGTERM');
      ffmpegProcess = null;
      console.log('FFmpeg process terminated due to socket disconnect.');
    }
  });
});

server.listen(5000, () => console.log(`HTTP Server is running on PORT 5000`));
