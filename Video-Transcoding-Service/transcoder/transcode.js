const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const transcodeVideo = (inputUrl, outputDir, baseURL, courseId, title) => {
  return new Promise((resolve, reject) => {
    // Define paths for each resolution's .m3u8 file
    const m3u8File360 = path.join(outputDir, '360p/index_360p.m3u8');
    const m3u8File480 = path.join(outputDir, '480p/index_480p.m3u8');
    const m3u8File720 = path.join(outputDir, '720p/index_720p.m3u8');
    const masterM3U8File = path.join(outputDir, 'master/master.m3u8');

    // Ensure output directories exist for each resolution and the master playlist
    ['360p', '480p', '720p', 'master'].forEach(dir => {
      const resolutionDir = path.join(outputDir, dir);
      if (!fs.existsSync(resolutionDir)) {
        fs.mkdirSync(resolutionDir, { recursive: true });
      }
    });

    // Define transcoding options for each resolution
    const transcodingOptions = [
      { resolution: '360', width: 640, height: 360, m3u8File: m3u8File360 },
      { resolution: '480', width: 854, height: 480, m3u8File: m3u8File480 },
      { resolution: '720', width: 1280, height: 720, m3u8File: m3u8File720 }
    ];

    // Process each resolution as a separate transcoding promise
    const transcodePromises = transcodingOptions.map(({ resolution, width, height, m3u8File }) => {
      return new Promise((res, rej) => {
        ffmpeg(inputUrl)
          .outputOptions('-f hls')
          .outputOptions('-hls_time 10') // Each .ts file segment duration
          .outputOptions('-hls_list_size 0') // Include all .ts files in .m3u8 file
          .outputOptions('-hls_segment_filename', `${path.dirname(m3u8File)}/${resolution}p_%03d.ts`) // Set output .ts file pattern
          .outputOptions(`-vf scale=${width}:${height}`) // Video scaling for resolution
          .save(m3u8File)
          .on('end', () => {
            console.log(`${resolution}p transcoding finished. Files saved in ${path.dirname(m3u8File)}`);
            res();
          })
          .on('error', (error) => {
            console.error(`Error generating ${resolution}p m3u8 file:`, error);
            rej(error);
          });
      });
    });

    // Generate master playlist referencing each resolution playlist after transcoding
    Promise.all(transcodePromises)
      .then(() => {
        // Adjust the `baseURL` to reference each resolution in the correct folder path on Cloudinary
        const masterM3U8Content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
${baseURL}/${courseId}/${title}/360p/index_360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
${baseURL}/${courseId}/${title}/480p/index_480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
${baseURL}/${courseId}/${title}/720p/index_720p.m3u8`;

        // Write the master playlist file
        fs.writeFileSync(masterM3U8File, masterM3U8Content);
        console.log('Master m3u8 file created at', masterM3U8File);

        // Resolve with paths to all created playlists
        resolve([m3u8File360, m3u8File480, m3u8File720, masterM3U8File]);
      })
      .catch(reject);
  });
};

module.exports = transcodeVideo;
