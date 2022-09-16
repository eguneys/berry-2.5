const template = (songData) => ({
  songData,
  rowLen: 5513,   // In sample lengths
  patternLen: 32,  // Rows per pattern
  endPattern: 0,  // End pattern
  numChannels: 1  // Number of channels
})

const dam = template(
[
        { // Instrument 0
          i: [
          1, // OSC1_WAVEFORM
          255, // OSC1_VOL
          128, // OSC1_SEMI
          184, // OSC1_XENV
          1, // OSC2_WAVEFORM
          121, // OSC2_VOL
          128, // OSC2_SEMI
          9, // OSC2_DETUNE
          164, // OSC2_XENV
          21, // NOISE_VOL
          13, // ENV_ATTACK
          0, // ENV_SUSTAIN
          56, // ENV_RELEASE
          5, // ENV_EXP_DECAY
          0, // ARP_CHORD
          0, // ARP_SPEED
          1, // LFO_WAVEFORM
          45, // LFO_AMT
          7, // LFO_FREQ
          1, // LFO_FX_FREQ
          2, // FX_FILTER
          58, // FX_FREQ
          180, // FX_RESONANCE
          0, // FX_DIST
          32, // FX_DRIVE
          0, // FX_PAN_AMT
          3, // FX_PAN_FREQ
          0, // FX_DELAY_AMT
          2 // FX_DELAY_TIME
          ],
          // Patterns
          p: [1],
          // Columns
          c: [
            {n: [151],
             f: []}
          ]
        },
      ]
)

const hit = template(
[
        { // Instrument 0
          i: [
          0, // OSC1_WAVEFORM
          32, // OSC1_VOL
          126, // OSC1_SEMI
          0, // OSC1_XENV
          3, // OSC2_WAVEFORM
          69, // OSC2_VOL
          127, // OSC2_SEMI
          0, // OSC2_DETUNE
          0, // OSC2_XENV
          84, // NOISE_VOL
          28, // ENV_ATTACK
          5, // ENV_SUSTAIN
          28, // ENV_RELEASE
          32, // ENV_EXP_DECAY
          66, // ARP_CHORD
          4, // ARP_SPEED
          3, // LFO_WAVEFORM
          87, // LFO_AMT
          4, // LFO_FREQ
          0, // LFO_FX_FREQ
          2, // FX_FILTER
          30, // FX_FREQ
          148, // FX_RESONANCE
          0, // FX_DIST
          55, // FX_DRIVE
          0, // FX_PAN_AMT
          3, // FX_PAN_FREQ
          0, // FX_DELAY_AMT
          4 // FX_DELAY_TIME
          ],
          // Patterns
          p: [1],
          // Columns
          c: [
            {n: [147],
             f: []}
          ]
        },
      ]
)

export const sound3 = template([{ // Instrument 2
  i: [
    0, // OSC1_WAVEFORM
    0, // OSC1_VOL
    92, // OSC1_SEMI
    0, // OSC1_XENV
    3, // OSC2_WAVEFORM
    0, // OSC2_VOL
    92, // OSC2_SEMI
    3, // OSC2_DETUNE
    255, // OSC2_XENV
    25, // NOISE_VOL
    16, // ENV_ATTACK
    37, // ENV_SUSTAIN
    56, // ENV_RELEASE
    13, // ENV_EXP_DECAY
    0, // ARP_CHORD
    0, // ARP_SPEED
    0, // LFO_WAVEFORM
    33, // LFO_AMT
    8, // LFO_FREQ
    1, // LFO_FX_FREQ
    2, // FX_FILTER
    47, // FX_FREQ
    172, // FX_RESONANCE
    1, // FX_DIST
    222, // FX_DRIVE
    0, // FX_PAN_AMT
    3, // FX_PAN_FREQ
    8, // FX_DELAY_AMT
    11 // FX_DELAY_TIME
  ],
  // Patterns
  p: [1],
  // Columns
  c: [ {n: [147,149,151,152,147,149,151,152,149,147,151,152,149,151,147,152],
        f: []}
  ]
}])

export const sound4 = template([
    { // Instrument 3
      i: [
        3, // OSC1_WAVEFORM
        224, // OSC1_VOL
        109, // OSC1_SEMI
        115, // OSC1_XENV
        0, // OSC2_WAVEFORM
        166, // OSC2_VOL
        109, // OSC2_SEMI
        207, // OSC2_DETUNE
        202, // OSC2_XENV
        0, // NOISE_VOL
        27, // ENV_ATTACK
        19, // ENV_SUSTAIN
        255, // ENV_RELEASE
        101, // ENV_EXP_DECAY
        0, // ARP_CHORD
        0, // ARP_SPEED
        0, // LFO_WAVEFORM
        0, // LFO_AMT
        0, // LFO_FREQ
        0, // LFO_FX_FREQ
        2, // FX_FILTER
        44, // FX_FREQ
        124, // FX_RESONANCE
        1, // FX_DIST
        32, // FX_DRIVE
        0, // FX_PAN_AMT
        6, // FX_PAN_FREQ
        148, // FX_DELAY_AMT
        2 // FX_DELAY_TIME
      ],
      // Patterns
      p: [1],
      // Columns
      c: [ {n: [123,,,127,,,,127,,,127,,,128,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,125,,130],
            f: []}
      ]
    }])


export const data = [hit, dam]
