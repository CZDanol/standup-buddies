<script lang="ts">
  import ApexCharts from "apexcharts";
  import { untrack } from "svelte";
  import { SpecialSpeakingState } from "../domain/types";
  import { meeting, speakingStateLabel, type Attendee } from "../meeting.svelte";
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
        height: 500,
        background: "transparent",
      },
      theme: { mode: "dark" },
      labels: states.map(speakingStateLabel),
      colors: states.map(stateColor),
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
        enabled: false,
      },
      plotOptions: {
        pie: {
          borderRadius: 8,
          spacing: 2,
          dataLabels: {
            external: {
              show: true,
              formatter: (name: string, opts: any) => [
                name,
                formatDuration(opts.value),
              ],
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
    // Track only state transitions;
    // times are read untracked so the repaint tick does not redraw the pie.
    void meeting.speakingState;
    chart?.updateSeries(untrack(values));
  });
</script>

<div bind:this={container}></div>
