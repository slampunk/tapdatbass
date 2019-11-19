import { getMinMax } from '../lib/utils.js';

export default class BeatDetectorService {
  constructor({ emitter }) {
    this.emitter = emitter;
  }

  calculateBPM = e => {
    const filteredBuffer = e.renderedBuffer;
    const data = filteredBuffer.getChannelData(0);
    const [ min, max ] = getMinMax(data);
    const threshold = min + (max - min) * 0.95;
    const peaks = this.getPeaksAtThreshold(data, threshold);
    const intervalCounts = this.countIntervalsBetweenNearbyPeaks(peaks);
    const tempoCounts = this.groupNeighboursByTempo(intervalCounts, e.target.sampleRate);
    tempoCounts.sort(function(a, b) {
      return b.count - a.count;
    });

    if (tempoCounts[0]) {
      return this.emitter.emit('track.analysis', {
        bpm: tempoCounts[0].tempo,
        threshold,
        max,
        min
      });
    }

    this.emitter.emit('track.bpm.error');
  }

  getPeaksAtThreshold(data, threshold) {
    const SAMPLE_SKIP = 10000;

    const peaksArray = [];
    const length = data.length;
    for (let i = 0; i < length; i++) {
      if (data[i] > threshold) {
        peaksArray.push(i);
        // Skip forward ~ 1/4s to get past this peak.
        i += SAMPLE_SKIP;
      }
    }
    return peaksArray;
  }

  countIntervalsBetweenNearbyPeaks(peaks) {
    const intervalCounts = [];
    peaks.forEach((peak, index) => {
      for (let i = 0; i < 10; i++) {
        const interval = peaks[index + i] - peak;
        const foundInterval = intervalCounts.some(function(intervalCount) {
          if (intervalCount.interval === interval) return intervalCount.count++;
        });

        //Additional checks to avoid infinite loops in later processing
        if (!isNaN(interval) && interval !== 0 && !foundInterval) {
          intervalCounts.push({
            interval: interval,
            count: 1
          });
        }
      }
    });

    return intervalCounts;
  }

  groupNeighboursByTempo(intervalCounts, sampleRate = 44100) {
    const tempoCounts = [];
    intervalCounts.forEach(intervalCount => {
      //Convert an interval to tempo
      let theoreticalTempo = 60 / (intervalCount.interval / sampleRate);
      theoreticalTempo = Math.round(theoreticalTempo);
      if (theoreticalTempo === 0) {
        return;
      }

      // Adjust the tempo to fit within the 90-180 BPM range
      while (theoreticalTempo < 80) theoreticalTempo *= 2;
      while (theoreticalTempo > 200) theoreticalTempo /= 2;

      const foundTempo = tempoCounts.some(tempoCount => {
        if (tempoCount.tempo === theoreticalTempo) return tempoCount.count += intervalCount.count;
      });
      if (!foundTempo) {
        tempoCounts.push({
          tempo: Math.round(theoreticalTempo),
          count: intervalCount.count
        });
      }
    });

    return tempoCounts;
  }
}
