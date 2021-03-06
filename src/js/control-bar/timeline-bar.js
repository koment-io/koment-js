/**
 * @file timeline-bar.js
 */
import videojs from'video.js';
import * as Dom from '../../utils/dom.js';

let Component = videojs.getComponent('Component');
/**
 * Shows load progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class TimelineBar
 */
class TimelineBar extends Component {

  constructor (player, options) {
    super(player, options);
    this.on(player, 'progress', this.update);
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl () {
    return super.createEl('div', {
      className: 'koment-timeline-bar',
      innerHTML: `<span class="vjs-control-text"><span>${this.localize('Loaded')}</span>: 0%</span>`
    });
  }

  /**
   * Update progress bar
   *
   * @method update
   */
  update () {
    const buffered = this.player_.buffered();
    const duration = this.player_.duration();
    const bufferedEnd = this.player_.bufferedEnd();
    const children = this.el_.children;

    // get the percent width of a time compared to the total end
    const percentify = function (time, end) {
      // no NaN
      const percent = (time / end) || 0;

      return ((percent >= 1 ? 1 : percent) * 100) + '%';
    };

    // update the width of the progress bar
    this.el_.style.width = percentify(bufferedEnd, duration);

    // add child elements to represent the individual buffered time ranges
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      let part = children[i];

      if (!part) {
        part = this.el_.appendChild(Dom.createEl());
      }

      // set the percent based on the width of the progress bar (bufferedEnd)
      part.style.left = percentify(start, bufferedEnd);
      part.style.width = percentify(end - start, bufferedEnd);
    }

    // remove unused buffered range elements
    for (let i = children.length; i > buffered.length; i--) {
      this.el_.removeChild(children[i - 1]);
    }
  }

}

Component.registerComponent('TimelineBar', TimelineBar);
export default TimelineBar;
