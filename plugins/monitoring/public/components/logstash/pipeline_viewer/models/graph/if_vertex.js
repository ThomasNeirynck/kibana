import { intersection } from 'lodash';
import { Vertex } from './vertex';
import ifIcon from 'plugins/monitoring/icons/logstash/if.svg';

export class IfVertex extends Vertex {
  get typeString() {
    return 'if';
  }

  get name() {
    return this.json.condition;
  }

  get icon() {
    return ifIcon;
  }

  get title() {
    return 'if';
  }

  get subtitle() {
    return {
      complete: this.name,
      display: this.truncateStringForDisplay(this.name, this.displaySubtitleMaxLength)
    };
  }

  get displaySubtitleMaxLength() {
    return 39;
  }

  get trueEdge() {
    return this.outgoingEdges.find(e => e.when === true);
  }

  get falseEdge() {
    return this.outgoingEdges.find(e => e.when === false);
  }

  get trueOutgoingVertex() {
    return this.trueEdge ? this.trueEdge.to : null;
  }

  get falseOutgoingVertex() {
    return this.falseEdge ? this.falseEdge.to : null;
  }

  get next() {
    const trueDescendants = this.trueOutgoingVertex ? this.trueOutgoingVertex.descendants().vertices : [];
    const falseDescendants = this.falseOutgoingVertex ? this.falseOutgoingVertex.descendants().vertices : [];

    trueDescendants.unshift(this.trueOutgoingVertex);
    falseDescendants.unshift(this.falseOutgoingVertex);

    return intersection(trueDescendants, falseDescendants)[0];
  }

}
