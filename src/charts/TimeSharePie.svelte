<script lang="ts">
  import ApexCharts from "apexcharts";
  import { untrack } from "svelte";
  import { SpecialSpeakingState } from "../domain/types";
  import {
    meeting,
    speakingStateInitials,
    speakingStateLabel,
    type Attendee,
  } from "../meeting.svelte";
  import { formatDuration } from "../format";
  import { stateColor } from "./palette";

  type Slice = Attendee | SpecialSpeakingState.Mayhem;

  // Slice order is fixed: roster order, then Mayhem.
  // Pause is deliberately not shown.
  const states: Slice[] = [...meeting.attendees, SpecialSpeakingState.Mayhem];

  function values(): number[] {
    return states.map((state) => meeting.speakingTimeMs(state));
  }

  let container: HTMLDivElement | undefined = $state();
  let chart: ApexCharts | undefined;

  $effect(() => {
    if (!container) {
      return;
    }
    chart = new ApexCharts(container, {
      chart: {
        type: "donut",
        height: 640,
        background: "transparent",
      },
      // Breathing room for the external labels above and below the circle.
      // The top needs less: the pie already sits low
      grid: { padding: { top: 20, bottom: 60 } },
      theme: { mode: "dark" },
      labels: states.map(speakingStateLabel),
      colors: untrack(() => states.map(stateColor)),
      legend: { show: false },
      tooltip: { y: { formatter: (value: number) => formatDuration(value) } },
      // Mayhem gets a checkered fill so it never reads as just another attendee.
      fill: {
        type: states.map((state) =>
          state === SpecialSpeakingState.Mayhem ? "pattern" : "solid",
        ),
        pattern: {
          style: "slantedLines",
          width: 8,
          height: 8,
        },
      },
      dataLabels: {
        enabled: true,
        // Inside-slice labels are just the initials; names and durations
        // live in the external labels and the tooltip.
        formatter: (_percent: number, opts: any) =>
          speakingStateInitials(states[opts.seriesIndex]),
      },
      plotOptions: {
        pie: {
          borderRadius: 8,
          spacing: 2,
          dataLabels: {
            external: {
              show: true,
              // Tiny slices get no label
              // (minAngleToShowLabel does not apply to external labels.)
              formatter: (name: string, opts: any) =>
                opts.percent < 5 ? "" : [name, formatDuration(opts.value)],
            },
          },
          donut: {
            labels: {
              show: true,
              value: {
                formatter: (value: string) => formatDuration(Number(value)),
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                formatter: (w: any) =>
                  formatDuration(
                    w.globals.seriesTotals.reduce(
                      (sum: number, value: number) => sum + value,
                      0,
                    ),
                  ),
              },
            },
          },
        },
      },
      stroke: {
        width: 0,
      },
      series: untrack(values),
    });
    chart.render();
    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });

  $effect(() => {
    // Track state transitions and the speaking order (colors follow it);
    // times are read untracked so the repaint tick does not redraw the pie.
    void meeting.speakingState;
    chart?.updateOptions({
      colors: states.map(stateColor),
      series: untrack(values),
    });
  });
</script>

<div bind:this={container}></div>
