// Mustache tamplates
var track_head_template = `<table>

<tr>
<th> </th>
<th>Section</th>
<th>Type</th>
<th>Preset #</th>
<th>Name</th>
<th>Length</th>
<th>Colour</th>
<th>Info</th>
</tr>
<tr>
<td class='soundviewbtn' trackno='{{trackNum}}'>&#x25BA</td>
<td>{{section}}</td>
<td>{{kindName}}</td>
<td>{{patch}}</td>
<td>{{patchName}}</td>
<td>{{len}}</td>
<td>{{colourOffset}}</td>
<td>{{info}}</td>
</tr>
</table>
<div id='snd_place{{trackNum}}'> </div>`;

var track_copy_template = `<input type='button' class='clipbtn' value='Copy To Clipboard' trackno='{{trackNum}}'><p/>`;
/*
var sound_view_template = `<input type='button' class='soundviewbtn' value='View Sound Info' trackno='{{trackNum}}'><p/>
	<div id='snd_place{{trackNum}}'> </div>`;
*/

var paster_template = `<hr><div>
			<b>Paste track data in field below to add it to song.</b><br>
			<textarea id='paster' rows='2' class='tinybox'></textarea>{{#iOSDevice}}<br><input type='button' value='Add Track' id='iosSubmit'>{{/iOSDevice}}
		</div><br><hr>`;

// This table expands into a parameter display which follows the
// "Shortcut template" layout:
// 
/* Vertical grouping class names
sample1
audio
zone
sample2
osc1
osc2
fmmod1
fmmod2
master
distortion
voice
unison
envelope1
lpf
envelope2
hpf
sidechain
arp
lfo1
modfx
lfo2
reverb
delay
modsources

/// Horizontal grouping class names
start
frequency
end
destination
resonance
adjust
browse
feedback
dboct
record
retrigphase
pitchtime
pw
attack
amount
speed
type
decay
shape
reverse
transpose
sustain
sync
mode
volume
release
rate

*/
var modKnobTemplate = `<table class='mod_knobs'>
<!-- Mod Knob Mappings -->
<tr>
<th class='mkhead' colspan='8'>{{title}}</th>
</tr>
</tr>
<tr>
<th class='mkhead'>Volume</th>
<th class='mkhead'>Cutoff/FM</th>
<th class='mkhead'>Attack</th>
<th class='mkhead'>Delay Time</th>

<th class='mkhead'>Sidechain</th>
<th class='mkhead'>Mod Rate</th>
<th class='mkhead'>Stutter</th>
<th class='mkhead'>Custom 2</th>
</tr>
<tr>
<td class='mkhdata'>{{mk1}}</td>
<td class='mkhdata'>{{mk3}}</td>
<td class='mkhdata'>{{mk5}}</td>
<td class='mkhdata'>{{mk7}}</td>

<td class='mkhdata'>{{mk9}}</td>
<td class='mkhdata'>{{mk11}}</td>
<td class='mkhdata'>{{mk13}}</td>
<td class='mkhdata'>{{mk15}}</td>
</tr>
<tr>
<th class='mkhead'>Pan</th>
<th class='mkhead'>Res/FM</th>
<th class='mkhead'>Release</th>
<th class='mkhead'>Amount</th>

<th class='mkhead'>Reverb</th>
<th class='mkhead'>Depth</th>
<th class='mkhead'>Custom 1</th>
<th class='mkhead'>Custom 3</th>
</tr>
<tr>
<td class='mkhdata'>{{mk0}}</td>
<td class='mkhdata'>{{mk2}}</td>
<td class='mkhdata'>{{mk4}}</td>
<td class='mkhdata'>{{mk6}}</td>

<td class='mkhdata'>{{mk8}}</td>
<td class='mkhdata'>{{mk10}}</td>
<td class='mkhdata'>{{mk12}}</td>
<td class='mkhdata'>{{mk14}}</td>
</tr>
</table>`;

var sample_list_header =`<tr class='kithead'>
<th> </th>
<th>Name</th>
<th>Path</th>
<th>Start</th>
<th>End</th>
<th>Osc2 Path</th>
<th>Osc2 Start</th>
<th>Osc2 End</th>
</tr>`;

var sample_entry_template = `<tr class='kitentry'>
<td class='kit_opener' kitItem='{{index}}'>&#x25BA</td>
<td>{{sound_name}}</td>
<td style='text-align: left'>{{fileName}}</td>
<td>{{startTime}}</td>
<td>{{endTime}}</td>
<td>{{fileName2}}</td>
<td>{{startTime2}}</td>
<td>{{endTime2}}</td>

</tr><div class='kit_spot'> <div>`;


var sound_template = `<table class='sound_grid'>

<!-- Row 0 -->
<tr>
<th class='zone start sample1'>Start 1</th>
<th class='zone start sample2'>Start 2</th>
<th class='unlab' style='border-bottom: hidden'> </th>
<th class='unlab' style='border-bottom: hidden'> </th>

<th class='unlab' style='border-bottom: hidden'> </th>
<th class='unlab' style='border-bottom: hidden'> </th>
<th class='distortion'>Saturation</th>
<th class='unlab' style='border-bottom: hidden'> </th>

<th class='lpf frequency'>LPF freq</th>
<th class='hpf frequency'>HPF freq</th>
<th class='frequency bass'>Bass</th>
<th class='frequency treble'>Treble</th>

<th class='modfx'>Rate</th>
<th class='reverb'>Room Size</th>
<th class='unlab' style='border-bottom: hidden'> </th>
<th class='unlab' style='border-bottom: hidden'> </th>
</tr>

<tr>
<td class='zone start sample1'>{{osc1.startMilliseconds}}</td>
<td class='zone start sample2'>{{osc2.startMilliseconds}}</td>
<td class='unlab'>{{c03}}</td>
<td class='unlab'>{{c04}}</td>

<td class='unlab'>{{c05}}</td>
<td class='unlab'>{{c06}}</td>
<td class='distortion'>{{c07}}</td>
<td class='unlab'>{{c08}}</td>

<td class='lpf frequency'>{{lpfFrequency}}</td>
<td class='hpf frequency'>{{hpfFrequency}}</td>
<td class='frequency bass'>{{equalizer.bassFrequency}}</td>
<td class='frequency treble'>{{equalizer.trebleFrequency}}</td>

<td class='modfx'>{{modFXRate}}</td>
<td class='reverb'>{{reverb.roomSize}}</td>
<td class='unlab'>{{c15}}</td>
<td class='unlab'>{{c16}}</td>
</tr>

<!-- Row 1 -->

<tr>
<th class='zone end sample1'>End 1</th>
<th class='zone end sample2'>End 2</th>
<th class='noise'>Noise</th>
<th class='osc2'>Osc Sync</th>

<th class='destination fmmod1'>Mod1 Dest</th>
<th class='destination fmmod2'>Mod2 Dest</th>
<th class='distortion'>Bitcrush</th>
<th class='unlab' style='border-bottom: hidden'> </th>

<th class='lpf resonance'>LPF res</th>
<th class='hpf resonance'>HPF res</th>
<th class='bass adjust'>Adj Bass</th>
<th class='treble adjust'>Adj Treble</th>

<th class='modfx'>Depth</th>
<th class='reverb'>Dampening</th>
<th class='modsources'>Env 1</th>
<th class='modsources'>Env 2</th>
</tr>

<tr>
<td class='zone end sample1'>{{osc1.endMilliseconds}}</td>
<td class='zone end sample2'>{{osc2.endMilliseconds}}</td>
<td class='noise'>{{noiseVolume}}</td>
<td class='osc2'>{{c20}}</td>

<td class='destination fmmod1'>{{c21}}</td>
<td class='destination fmmod2'>{{c22}}</td>
<td class='distortion'>{{bitCrush}}</td>
<td class='unlab'> </th>

<td class='lpf resonance'>{{lpfResonance}}</td>
<td class='hpf resonance'>{{hpfResonance}}</td>
<td class='bass adjust'>{{equalizer.bass}}</td>
<td class='treble adjust'>{{equalizer.treble}}</td>

<td class='modfx'>{{modFXDepth}}</td>
<td class='reverb'>{{reverb.dampening}}</td>
<td class='textsm modsources m_envelope1'>{{m_envelope1}}</td>
<td class='textsm modsources m_envelope2'>{{m_envelope2}}</td>
</tr>

<!-- Row 2 -->
<tr>
<th class='audio browse sample1'>Browse 1</th>
<th class='audio browse sample2'>Browse 2</th>
<th class='osc1 feedback'>Feedbk 1</th>
<th class='osc2 feedback'>Feedbk 2</th>

<th class='fmmod1 feedback'>Feedbk f1</th>
<th class='fmmod2 feedback'>Feedbk f2</th>
<th class='distortion'>Decimation</th>
<th class='unlab' style='border-bottom: hidden'> </th>

<th class='dboct lpf'>LPF dB/O</th>
<th class='dboct hpf'>HPF dB/O</th>
<th class='sidechain'>Send</th>
<th class='unlab' style='border-bottom: hidden'> </th>

<th class='modfx'>Feedback</th>
<th class='reverb'>Width</th>
<th class='modsources'>LFO 1</th>
<th class='modsources'>LFO 2</th>
</tr>

<tr>
<td class='audio browse sample1'>{{c33}}</td>
<td class='audio browse sample2'>{{c34}}</td>
<td class='osc1 feedback'>{{carrier1Feedback}}</td>
<td class='osc2 feedback'>{{carrier2Feedback}}</td>
              
<td class='fmmod1 feedback'>{{modulator1Feedback}}</td>
<td class='fmmod2 feedback'>{{modulator2Feedback}}</td>
<td class='distortion'>{{c39}}</td>
<th class='unlab' style='border-bottom: hidden'> </th>
              
<td class='dboct lpf'>{{lpfMode}}</td>
<td class='dboct hpf'>{{hpfMode}}</td>
<td class='sidechain'>{{c43}}</td>
<td class='unlab'>{{c44}}</td>
              
<td class='modfx'>{{modFXFeedback}}</td>
<td class='reverb'>{{reverb.width}}</td>
<td class='textsm modsources m_lfo1'>{{m_lfo1}}</td>
<td class='textsm modsources m_lfo2'>{{m_lfo2}}</td>
</tr>

<!-- Row 3 -->
<tr>
<th class='audio record sample1'>Record 1</th>
<th class='audio record sample2'>Record 2</th>
<th class='osc1 retrigphase'>Retrig 1</th>
<th class='osc2 retrigphase'>Retrig 2</th>

<th class='fmmod1 retrigphase'>Retrig f1</th>
<th class='fmmod2 retrigphase'>Retrig f2</th>
<th class='master'>Synth Mode</th>
<th class='unison'>Unison #</th>

<th class='unlab' style='border-bottom: hidden'> </th>
<th class='unlab' style='border-bottom: hidden'> </th>
<th class='sidechain'>Shape</th>
<th class='arp'>Arp Mode</th>

<th class='modfx'>Offset</th>
<th class='reverb'>Pan</th>
<th class='delay'>Stereo</th>
<th class='modsources'>Sidechain</th>
</tr>

<tr>
<td class='audio record sample1'>{{c49}}</td>
<td class='audio record sample2'>{{c50}}</td>
<td class='osc1 retrigphase'>{{c51}}</td>
<td class='osc2 retrigphase'>{{c52}}</td>
              
<td class='fmmod1 retrigphase'>{{c53}}</td>
<td class='fmmod2 retrigphase'>{{c54}}</td>
<td class='master textsm'>{{mode}}</td>
<td class='unison'>{{unison.num}}</td>
              
<td class='unlab'>{{c57}}</td>
<td class='unlab'>{{c58}}</td>
<td class='sidechain'>{{c59}}</td>
<td class='arp'>{{c60}}</td>
              
<td class='modfx'>{{modFXOffset}}</td>
<td class='reverb'>{{reverb.pan}}</td>
<td class='delay'>{{c63}}</td>
<td class='textsm modsources m_sidechain'>{{m_sidechain}}</td>
</tr>

<!-- Row 4 -->
<tr>
<th class='sample1 pitchtime'>Pitch/T 1</th>
<th class='sample2 pitchtime'>Pitch/T 2</th>
<th class='osc1 pw'>PW 1</th>
<th class='osc2 pw'>PW 2</th>

<th class='fmmod1 pw'>PW f1</th>
<th class='fmmod2 pw'>PW f2</th>
<th class='master'>Master Pan</th>
<th class='unison'>Detune</th>

<th class='attack env1'>Attack 1</th>
<th class='attack env2'>Attack 2</th>
<th class='attack sidechain'>SC Attack</th>
<th class='arp'>Arp Octs</th>

<th class='modfx'>Type</th>
<th class='reverb amount'>Rvrb Amt</th>
<th class='delay amount'>Delay Amt</th>
<th class='modsources'>Note</th>
</tr>


<tr>
<td class='sample1 pitchtime'>{{c65}}</td>
<td class='sample2 pitchtime'>{{c66}}</td>
<td class='osc1 pw'>{{c67}}</td>
<td class='osc2 pw'>{{c68}}</td>
              
<td class='fmmod1 pw'>{{c69}}</td>
<td class='fmmod2 pw'>{{c70}}</td>
<td class='master'>{{pan}}</td>
<td class='unison'>{{unison.detune}}</td>
              
<td class='attack env1'>{{envelope1.attack}}</td>
<td class='attack env2'>{{envelope2.attack}}</td>
<td class='attack sidechain'>{{c75}}</td>
<td class='arp'>{{c76}}</td>
              
<td class='modfx'>{{modFXType}}</td>
<td class='reverb amount'>{{reverbAmount}}</td>
<td class='delay amount'>{{delayFeedback}}</td>
<td class='textsm modsources m_note'>{{m_note}}</td>
</tr>

<!-- Row 5 -->
<tr>
<th class='sample1 speed'>Speed 1</th>
<th class='sample2 speed'>Speed 2</th>
<th class='osc1 type'>Type 1</th>
<th class='osc2 type'>Type 2</th>

<th class='fmmod1 type'>Type f1</th>
<th class='fmmod2 type'>Type f2</th>
<th class='master'>Vibrato</th>
<th class='voice'>Priority</th>

<th class='env1 decay'>Decay 1</th>
<th class='env2 decay'>Decay 2</th>
<th class='sidechain'>Vol Duck</th>
<th class='arp'>Gate</th>

<th class='lfo1 shape'>LFO1 Shape</th>
<th class='lfo2 shape'>LFO2 Shape</th>
<th class='delay'>Analog</th>
<th class='modsources'>Random</th>
</tr>

<tr>
<td class='sample1 speed'>{{c81}}</td>
<td class='sample2 speed'>{{c82}}</td>
<td class='osc1 type'>{{osc1.type}}</td>
<td class='osc2 type'>{{osc2.type}}</td>
              
<td class='fmmod1 type'>{{c85}}</td>
<td class='fmmod2 type'>{{c86}}</td>
<td class='master'>{{c87}}</td>
<td class='voice'>{{voicePriority}}</td>
              
<td class='env1 decay'>{{envelope1.decay}}</td>
<td class='env2 decay'>{{envelope2.decay}}</td>
<td class='sidechain'>{{c91}}</td>
<td class='arp'>{{c92}}</td>
              
<td class='lfo1 shape'>{{lfo1.type}}</td>
<td class='lfo2 shape'>{{lfo2.type}}</td>
<td class='delay'>{{delay.analog}}</td>
<td class='textsm modsources m_random'>{{m_random}}</td>
</tr>

<!-- Row 6 -->
<tr>
<th class='sample1 reverse'>Reverse 1</th>
<th class='sample2 reverse'>Reverse 2</th>
<th class='osc1 transpose'>Trans 1</th>
<th class='osc2 transpose'>Trans 2</th>

<th class='fmmod1 transpose'>Trans f1</th>
<th class='fmmod2 transpose'>Trans f2</th>
<th class='master transpose'>Trans Master</th>
<th class='voice'>Poly</th>

<th class='env1 sustain'>Sustain 1</th>
<th class='env2 sustain'>Sustain 2</th>
<th class='sidechain'>SC Sync</th>

<th class='arp sync'>Arp Sync</th>

<th class='lfo1 sync'>LFO 1 Sync</th>
<th class='lfo2 sync'>LFO 2 Sync</th>
<th class='delay sync'>Delay Sync</th>
<th class='modsources'>Velocity</th>
</tr>

<tr>
<td class='sample1 reverse'>{{c097}}</td>
<td class='sample2 reverse'>{{c098}}</td>
<td class='osc1 transpose'>{{osc1.transpose}}</td>
<td class='osc2 transpose'>{{osc2.transpose}}</td>
              
<td class='fmmod1 transpose'>{{c101}}</td>
<td class='fmmod2 transpose'>{{c102}}</td>
<td class='master transpose'>{{c103}}</td>
<td class='voice'>{{polyphonic}}</td>
              
<td class='env1 sustain'>{{envelope1.sustain}}</td>
<td class='env2 sustain'>{{envelope2.sustain}}</td>
<td class='sidechain'>{{c107}}</td>
<td class='arp sync'>{{c108}}</td>
              
<td class='lfo1 sync '>{{lfo1.syncLevel}}</td>
<td class='lfo2 sync '>{{lfo2.syncLevel}}</td>
<td class='delay sync '>{{delay.syncLevel}}</td>
<td class='textsm modsources m_velocity'>{{m_velocity}}</td>
</tr>

<!-- Row 7 -->
<tr>
<th class='sample1 mode'>Mode 1</th>
<th class='sample2 mode'>Mode 2</th>
<th class='osc1 volume'>Vol 1</th>
<th class='osc2 volume'>Vol 2</th>

<th class='fmmod1 volume'>Vol f1</th>
<th class='fmmod2 volume'>Vol f2</th>
<th class='master volume'>Vol Master</th>
<th class='voice'>Porta</th>

<th class='env1 release'>Release 1</th>
<th class='env2 release'>Release 2</th>
<th class='sidechain release'>Release SC</th>
<th class='arp rate'>Arp Rate</th>

<th class='lfo1 rate'>LFO1 Rate</th>
<th class='lfo2 rate'>LFO2 Rate</th>
<th class='rate delay'>Delay Rate</th>
<th class='modsources'>Aftertouch</th>
</tr>

<tr>
<td class='sample1 mode'>{{c113}}</td>
<td class='sample2 mode'>{{c114}}</td>
<td class='osc1 volume'>{{oscAVolume}}</td>
<td class='osc2 volume'>{{oscBVolume}}</td>

<td class='fmmod1 volume'>{{c117}}</td>
<td class='fmmod2 volume'>{{c118}}</td>
<td class='master volume'>{{volume}}</td>
<td class='voice'>{{portamento}}</td>

<td class='env1 release'>{{envelope1.release}}</td>
<td class='env2 release'>{{envelope2.release}}</td>
<td class='sidechain release'>{{c123}}</td>
<td class='arp rate'>{{arpeggiatorRate}}</td>

<td class='lfo1 rate'>{{lfo1Rate}}</td>
<td class='lfo2 rate'>{{lfo2Rate}}</td>
<td class='rate delay '>{{delayRate}}</td>
<td class='textsm modsources m_aftertouch'>{{m_aftertouch}}</td>
</tr>
</table><p/>`

// **** Thats all for the sound table