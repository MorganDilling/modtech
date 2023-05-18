import InvalidDurationException from 'exceptions/InvalidDurationException';

export default (duration: string | undefined | null): Date | null => {
  if (!duration) return null;
  // examples of durations:
  /**
   * 1s = 1 second
   * 1m = 1 minute
   * 1h = 1 hour
   * 1d = 1 day
   * 1w = 1 week
   * 1mo = 1 month
   * 1y = 1 year
   */

  const durations = duration.split(' ');
  let totalDuration = 0;

  for (const dur of durations) {
    const amount = parseInt(dur.slice(0, -1));
    const type = dur.slice(-1);

    switch (type) {
      case 's':
        totalDuration += amount * 1000;
        break;
      case 'm':
        totalDuration += amount * 60000;
        break;
      case 'h':
        totalDuration += amount * 3600000;
        break;
      case 'd':
        totalDuration += amount * 86400000;
        break;
      case 'w':
        totalDuration += amount * 604800000;
        break;
      case 'mo':
        totalDuration += amount * 2629800000;
        break;
      case 'y':
        totalDuration += amount * 31557600000;
        break;
      default:
        throw new InvalidDurationException(type);
    }
  }

  return new Date(totalDuration);
};
