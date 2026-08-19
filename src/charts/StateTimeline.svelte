<script lang="ts">
  import ApexCharts from "apexcharts";
  import { untrack } from "svelte";
  import { SpecialSpeakingState } from "../domain/types";
  import {
    meeting,
    speakingStateInitials,
    speakingStateLabel,
  } from "../meeting.svelte";
  import { formatDuration } from "../format";
  import { stateColor } from "./palette";

  // Everything renders in one series so all segments share a single row;
  // per-series options (like pattern fills) are therefore unavailable here.
  // Pause has no color and no label: its runs stay as empty gaps.

  function series() {
    return [
      {
        data: meeting.speakingStateHistory
          .filter((segment) => segment.state !== SpecialSpeakingState.Pause)
          .map((segment) => ({
            x: "Timeline",
            y: [segment.startMs, segment.endMs],
            fillColor: stateColor(segment.state),
            label: speakingStateLabel(segment.state),
            initials: speakingStateInitials(segment.state),
          })),
      },
    ];
  }

  let container: HTMLDivElement | undefined = $state();
  let chart: ApexCharts | undefined;

  $effect(() => {
    if (!container) {
      return;
    }
    chart = new ApexCharts(container, {
      chart: {
        type: "rangeBar",
        height: 120,
        toolbar: { show: false },
        background: "transparent",
      },
      theme: { mode: "dark" },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: { position: "bottom" },
        },
      },
      dataLabels: {
        enabled: true,
        textAnchor: "start",
        style: { fontSize: "11px", fontWeight: 600 },
        offsetX: 8,
        offsetY: -10,
        formatter: (_value: unknown, opts: any) => {
          const point =
            opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex];
          return [
            point.initials,
            formatDuration(point.y[1] - point.y[0]), //
          ];
        },
      },
      legend: { show: false },
      xaxis: {
        type: "datetime",
        min: meeting.startedAtMs,
        labels: {
          datetimeUTC: false,
          format: "HH:mm:ss",
        },
      },
      yaxis: { show: false },
      grid: { show: false },
      noData: { text: "No activity yet" },
      tooltip: {
        custom: (context: {
          seriesIndex: number;
          dataPointIndex: number;
          w: any;
        }) => {
          const point =
            context.w.config.series[context.seriesIndex].data[
              context.dataPointIndex
            ];
          const duration = formatDuration(point.y[1] - point.y[0]);
          return `<div class="p-2">${point.label} | ${duration}</div>`;
        },
      },
      series: untrack(series),
    });
    chart.render();
    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });

  $effect(() => {
    // The history holds only finished runs and grows exactly at state transitions,
    // so this updates on transitions and ignores the repaint tick.
    chart?.updateSeries(series());
  });
</script>

<div bind:this={container}></div>
