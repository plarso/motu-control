## GlobalSettings

### uid: string
@permission r
@since v0.0.0
@description The UID of the device. The UID is a 16 digit hexadecimal string that uniquely identifies this device on AVB networks.

### ext/caps/avb: semver_opt
@permission r
@since v0.0.0
@description The version of the avb section. If this path is absent, the device does not have the paths in the avb section.

### ext/caps/router: semver_opt
@permission r
@since v0.0.0
@description The version of the router section. If this path is absent, the device does not have the paths in the router section.

### ext/caps/mixer: semver_opt
@permission r
@since v0.0.0
@description The version of the mixer section. If this path is absent, the device does not have the paths in the mixer section.

## AVBSettings
The avb section of the datastore is special because it includes information on all AVB devices in the target device's AVB network, in addition to the local parameters of that device. The list of all devices exists at avb/devs. Each device in that list maintains a separate subtree, containing all AVB parameters, located at avb/${string}. Any AVB-capable device -- even those not created by MOTU -- will appear in the avb section, although MOTU-only parameters such as apiversion and url will only appear for MOTU devices.

### avb/devs: string_list
@permission r
@since v0.0.0
@description A list of UIDs for AVB devices on the same network as this device.

### avb/${string}/entity_model_id_h32: int
@permission r
@since v0.0.0
@description The vendor id of the connected AVB device.

### avb/${string}/entity_model_id_l32: int
@permission r
@since v0.0.0
@description The model id of the connected AVB device.

### avb/${string}/entity_name: string
@permission rw
@since v0.0.0
@description The human readable name of the connected AVB device. On MOTU devices, this may be changed by the
user or an API client (e.g., "My 1248").

### avb/${string}/model_name: string
@permission r
@since v0.0.0
@description The human readable model name of the connected AVB device (e.g., "1248").

### avb/${string}/hostname: string_opt
@permission r
@since v0.0.0
@description The sanitized hostname assigned to this device. This is only valid for MOTU devices. This may be different from entity_name in that it won't have spaces or non-ascii characters (e.g., "My-1248").

### avb/${string}/master_clock/capable: int_bool
@permission r
@since v0.0.0
@description True if this device supports MOTU Master Clock. MOTU Master Clock is a set of special datastore keys in the avb section that allows one device to quickly become the clock source of many others.

### avb/${string}/master_clock/uid: string_opt
@permission rw
@since v0.0.0
@description The UID of the device the master_clock stream is connected to, or the empty string if there is no connection. Only available for devices that are Master Clock capable (see master_clock/capable above).

### avb/${string}/vendor_name: string
@permission r
@since v0.0.0
@description The human readable vendor name of the connected AVB device (e.g., "MOTU").

### avb/${string}/firmware_version: string
@permission r
@since v0.0.0
@description The human readable firmware version number of the connected AVB device. For MOTU devices, this will be a semver.

### avb/${string}/serial_number: string
@permission r
@since v0.0.0
@description The human readable serial number of the connected AVB device.

### avb/${string}/controller_ignore: int_bool
@permission r
@since v0.0.0
@description True if this device should be ignored. If true, clients should not show this device in their UI.

### avb/${string}/acquired_id: string
@permission r
@since v0.0.0
@description The controller UID of the controller that acquired this box, or the empty string if no controller has acquired it. Acquisition is a part of the AVB standard that allows a controller to prevent other controllers from making changes on this device. You cannot initiate an acquisition from the datastore API, but you should avoid making changes on a device that has been acquired elsewhere.

### avb/${string}/motu.mdns.type: string_opt
@permission r
@since v0.0.0
@description The name of the device family for this device (e.g., "netiodevice"). This path is only valid for MOTU devices.

### avb/${string}/apiversion: semver_opt
@permission r
@since v0.0.0
@description The global datastore API version of the device. This path is only valid for MOTU devices.

### avb/${string}/url: string_opt
@permission r
@since v0.0.0
@description The canonical url of the device. This path is only valid for MOTU devices.

### avb/${string}/current_configuration: int
@permission rw
@since v0.0.0
@description The index of the currently active device configuration. MOTU devices only have one configuration, index 0. Other devices may have multiple available configurations.

### avb/${string}/cfg/${number}/object_name: string
@permission r
@since v0.0.0
@description The name of the configuration with the given index.

### avb/${string}/cfg/${number}/identify: int_bool
@permission rw
@since v0.0.0
@description True if the configuration is in identify mode. What identify mode means depends on the device. For MOTU devices, identify will flash the front panel backlight.

### avb/${string}/cfg/${number}/current_sampling_rate: int
@permission rw
@since v0.0.0
@description The sampling rate of the configuration with the given index.

### avb/${string}/cfg/${number}/sample_rates: int_list
@permission r
@since v0.0.0
@description A list of allowed sample rates for the configuration with the given index.

### avb/${string}/cfg/${number}/clock_source_index: int
@permission rw
@since v0.0.0
@description The currently chosen clock source for the configuration with the given index.

### avb/${string}/cfg/${number}/clock_sources/num: int
@permission r
@since v0.0.0
@description The number of available clock sources for the given configuration.

### avb/${string}/cfg/${number}/clock_sources/${number}/object_name: string
@permission r
@since v0.0.0
@description The name of the clock source with the given index.

### avb/${string}/cfg/${number}/clock_sources/${number}/type: string
@permission r
@since v0.0.0
@description The type of the clock source with the given index. The value will be one of "internal", "external", or "stream".

### avb/${string}/cfg/${number}/clock_sources/${number}/stream_id: int_opt
@permission r
@since v0.0.0
@description If the type of the clock source is "stream", the id of the stream from which it derives its clock. This path is only valid if the clock is a stream.

### avb/${string}/cfg/${number}/${'input' | 'output'}_streams/num: int
@permission r
@since v0.0.0
@description The number of available input or output AVB streams.

### avb/${string}/cfg/${number}/${'input' | 'output'}_streams/${number}/object_name: string
@permission r
@since v0.0.0
@description The name of the input or output stream with the given index

### avb/${string}/cfg/${number}/${'input' | 'output'}_streams/${number}/num_ch: int
@permission r
@since v0.0.0
@description The number of channels on the input or output stream.

### avb/${string}/cfg/${number}/input_streams/${number}/talker: string_pair
@permission rw
@since v0.0.0
@description The talker for the given input stream. The first element of the pair is the device UID, the second element of the pair is the stream ID that this stream is connected to.

### ext/clockLocked: int_bool
@permission r
@since v0.0.0
@description True if the clock is locked.

## RoutingAndIOSettings

### ext/wordClockMode: string
@permission rw
@since v0.2.0
@description "1x" if the word clock out should always be a 1x rate or "follow" if it should always follow the system clock

### ext/wordClockThru: string
@permission rw
@since v0.2.0
@description "thru" if the word clock output should be the same as the word clock input or "out" if it should be determined by the system clock

### ext/smuxPerBank: int_bool
@permission r
@since v0.2.0
@description True if each optical bank has its own SMUX setting

### ext/vlimit/lookahead: int_bool_opt
@permission rw
@since v0.0.0
@description True if vLimit lookahead is enabled. vLimit lookahead provides better input limiting, at the cost of small amounts of extra latency. This path is only present on devices with access to vLimit.

### ext/enableHostVolControls: int_bool
@permission rw
@since v0.1.0
@description True if the computer is allowed to control the volumes of computer-to-device streams.

### ext/maxUSBToHost: int
@permission rw
@since v0.1.0
@description Valid only when this device is connected to the computer via USB. This chooses the max number of channels/max sample rate tradeoff for the to/from computer input/output banks.

### ext/${'ibank' | 'obank'}/${number}/name: string
@permission r
@since v0.0.0
@description The name of the input or output bank

### ext/${'ibank' | 'obank'}/${number}/maxCh: int
@permission r
@since v0.0.0
@description The maximum possible number of channels in the input or output bank.

### ext/${'ibank' | 'obank'}/${number}/numCh: int
@permission r
@since v0.0.0
@description The number of channels available in this bank at its current sample rate.

### ext/${'ibank' | 'obank'}/${number}/userCh: int
@permission rw
@since v0.0.0
@description The number of channels that the user has enabled for this bank.

### ext/${'ibank' | 'obank'}/${number}/calcCh: int
@permission r
@since v0.0.0
@description The number of channels that are actually active. This is always the minimum of ext/${'ibank' | 'obank'}/${number}/userCh and ext/${'ibank' | 'obank'}/${number}/userCh.

### ext/${'ibank' | 'obank'}/${number}/smux: string
@permission rw
@since v0.2.0
@description For Optical banks, either "toslink" or "adat"

### ext/ibank/${number}/madiClock: string
@permission r
@since v0.2.0
@description For MADI input banks, this is the 2x clock mode of the input stream-- "1x" for 48/44.1kHz frame clock, or "2x" for 88.2/96kHz frame clock

### ext/obank/${number}/madiClock: string
@permission rw
@since v0.2.0
@description For MADI output banks, this is the 2x clock mode of the output stream-- "1x" for 48/44.1kHz frame clock, or "2x" for 88.2/96kHz frame clock

### ext/ibank/${number}/madiFormat: int
@permission r
@since v0.2.0
@description 56 or 64 representing 56 or 64 MADI channels at 1x, 28 or 32 channels at 2x, or 14 or 16 channels at 4x, respectively

### ext/obank/${number}/madiFormat: int
@permission rw
@since v0.2.0
@description 56 or 64 representing 56 or 64 MADI channels at 1x, 28 or 32 channels at 2x, or 14 or 16 channels at 4x, respectively

### ext/${'ibank' | 'obank'}/${number}/ch/${number}/name: string
@permission rw
@since v0.0.0
@description The channel's name.

### ext/obank/${number}/ch/${number}/src: int_pair_opt
@permission rw
@since v0.0.0
@description If the output channel is connected to an input bank, a ":" separated pair in the form " : ", otherwise, if unrouted, an empty string.

### ext/${'ibank' | 'obank'}/${number}/ch/${number}/phase: int_bool_opt
@permission rw
@since v0.0.0
@description True if the signal has its phase inverted. This is only applicable to some input or output channels.

### ext/${'ibank' | 'obank'}/${number}/ch/${number}/pad: int_bool_opt
@permission rw
@since v0.0.0
@description True if the 20 dB pad is engaged. This is only applicable to some input or output channels.

### ext/ibank/${number}/ch/${number}/48V: int_bool_opt
@permission rw
@since v0.0.0
@description True if the 48V phantom power is engaged. This is only applicable to some input channels.

### ext/ibank/${number}/ch/${number}/vlLimit: int_bool_opt
@permission rw
@since v0.0.0
@description True if the vLimit limiter is engaged. This is only applicable to some input channels.

### ext/ibank/${number}/ch/${number}/vlClip: int_bool_opt
@permission rw
@since v0.0.0
@description True if vLimit clip is engaged. This is only applicable to some input channels.

### ext/${'ibank' | 'obank'}/${number}/ch/${number}/trim: int_opt
@permission rw
@since v0.0.0
@description A dB-value for how much to trim this input or output channel. The range of this parameter is indicated by ext/${'ibank' | 'obank'}/${number}/ch/${number}/trimRange. Only available for certain input or output channels.

### ext/${'ibank' | 'obank'}/${number}/ch/${number}/trimRange: int_pair_opt
@permission rw
@since v0.0.0
@description A pair of the minimum followed by maximum values allowed for the trim parameter on the input or output channel.

### ext/${'ibank' | 'obank'}/${number}/ch/${number}/stereoTrim: int_opt
@permission rw
@since v0.0.0
@description A dB-value for how much to trim this input or output channel. This stereo trim affect both this channel and the next one. The range of this parameter is indicated by ext/${'ibank' | 'obank'}/${number}/ch/${number}/stereoTrimRange. Only available for certain input or output channels.

### ext/${'ibank' | 'obank'}/${number}/ch/${number}/stereoTrimRange: int_pair_opt
@permission rw
@since v0.0.0
@description A pair of the minimum followed by maximum values allowed for the stereoTrim parameter on the input or output channel.

### ext/${'ibank' | 'obank'}/${number}/ch/${number}/connection: int_bool_opt
@permission r
@since v0.0.0
@description True if the channel has a physical connector plugged in (e.g., an audio jack). This information may not be available for all banks or devices.

## MixerSettings
The mixer section as described is only valid for the current mixer version, 1.0. In future versions, paths, types, or valid parameter ranges may change.

### mix/ctrls/dsp/usage: int
@permission r
@since v1.0.0
@description The approximate percentage of DSP resources used for mixing and effects.

### mix/ctrls/${'hpf' | 'gate' | 'eq' | 'comp' | 'leveler' | 'reverb'}/avail: int_bool_opt
@permission r
@since v1.0.0
@description True if there are enough DSP resources to enable one more of the given effect.

### mix/chan/${number}/matrix/aux/${number}/send: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/chan/${number}/matrix/group/${number}/send: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/chan/${number}/matrix/reverb/${number}/send: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/chan/${number}/matrix/aux/${number}/pan: real
@permission rw
@since v1.0.0
@min -1
@max 1
@unit pan

### mix/chan/${number}/matrix/group/${number}/pan: real
@permission rw
@since v1.0.0
@min -1
@max 1
@unit pan

### mix/chan/${number}/matrix/reverb/${number}/pan: real
@permission rw
@since v1.0.0
@min -1
@max 1
@unit pan

### mix/chan/${number}/hpf/enable: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/hpf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/chan/${number}/eq/highshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/eq/highshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/chan/${number}/eq/highshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/chan/${number}/eq/highshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/chan/${number}/eq/highshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/chan/${number}/eq/mid1/enable: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/eq/mid1/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/chan/${number}/eq/mid1/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/chan/${number}/eq/mid1/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/chan/${number}/eq/mid2/enable: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/eq/mid2/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/chan/${number}/eq/mid2/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/chan/${number}/eq/mid2/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/chan/${number}/eq/lowshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/eq/lowshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/chan/${number}/eq/lowshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/chan/${number}/eq/lowshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/chan/${number}/eq/lowshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/chan/${number}/gate/enable: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/gate/release: real
@permission rw
@since v1.0.0
@min 50
@max 2000
@unit ms

### mix/chan/${number}/gate/threshold: real
@permission rw
@since v1.0.0
@min 0
@max 1
@unit linear

### mix/chan/${number}/gate/attack: real
@permission rw
@since v1.0.0
@min 10
@max 500
@unit ms

### mix/chan/${number}/comp/enable: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/comp/release: real
@permission rw
@since v1.0.0
@min 10
@max 2000
@unit ms

### mix/chan/${number}/comp/threshold: real
@permission rw
@since v1.0.0
@min -40
@max 0
@unit dB

### mix/chan/${number}/comp/ratio: real
@permission rw
@since v1.0.0
@min 1
@max 10

### mix/chan/${number}/comp/attack: real
@permission rw
@since v1.0.0
@min 10
@max 100
@unit ms

### mix/chan/${number}/comp/trim: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/chan/${number}/comp/peak: real_enum
@permission rw
@since v1.0.0
@enum RMS=0,Peak=1

### mix/chan/${number}/matrix/enable: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/matrix/solo: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/matrix/mute: real_bool
@permission rw
@since v1.0.0

### mix/chan/${number}/matrix/pan: real
@permission rw
@since v1.0.0
@min -1
@max 1
@unit pan

### mix/chan/${number}/matrix/fader: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/main/${number}/eq/highshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/main/${number}/eq/highshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/main/${number}/eq/highshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/main/${number}/eq/highshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/main/${number}/eq/highshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/main/${number}/eq/mid1/enable: real_bool
@permission rw
@since v1.0.0

### mix/main/${number}/eq/mid1/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/main/${number}/eq/mid1/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/main/${number}/eq/mid1/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/main/${number}/eq/mid2/enable: real_bool
@permission rw
@since v1.0.0

### mix/main/${number}/eq/mid2/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/main/${number}/eq/mid2/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/main/${number}/eq/mid2/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/main/${number}/eq/lowshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/main/${number}/eq/lowshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/main/${number}/eq/lowshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/main/${number}/eq/lowshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/main/${number}/eq/lowshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/main/${number}/leveler/enable: real_bool
@permission rw
@since v1.0.0

### mix/main/${number}/leveler/makeup: real
@permission rw
@since v1.0.0
@min 0
@max 100
@unit %

### mix/main/${number}/leveler/reduction: real
@permission rw
@since v1.0.0
@min 0
@max 100
@unit %

### mix/main/${number}/leveler/limit: real_bool
@permission rw
@since v1.0.0

### mix/main/${number}/matrix/enable: real_bool
@permission rw
@since v1.0.0

### mix/main/${number}/matrix/mute: real_bool
@permission rw
@since v1.0.0

### mix/main/${number}/matrix/fader: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/aux/${number}/eq/highshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/aux/${number}/eq/highshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/aux/${number}/eq/highshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/aux/${number}/eq/highshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/aux/${number}/eq/highshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/aux/${number}/eq/mid1/enable: real_bool
@permission rw
@since v1.0.0

### mix/aux/${number}/eq/mid1/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/aux/${number}/eq/mid1/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/aux/${number}/eq/mid1/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/aux/${number}/eq/mid2/enable: real_bool
@permission rw
@since v1.0.0

### mix/aux/${number}/eq/mid2/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/aux/${number}/eq/mid2/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/aux/${number}/eq/mid2/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/aux/${number}/eq/lowshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/aux/${number}/eq/lowshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/aux/${number}/eq/lowshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/aux/${number}/eq/lowshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/aux/${number}/eq/lowshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/aux/${number}/matrix/enable: real_bool
@permission rw
@since v1.0.0

### mix/aux/${number}/matrix/prefader: real_bool
@permission rw
@since v1.0.0

### mix/aux/${number}/matrix/panner: real_bool
@permission rw
@since v1.0.0

### mix/aux/${number}/matrix/mute: real_bool
@permission rw
@since v1.0.0

### mix/aux/${number}/matrix/fader: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/group/${number}/matrix/aux/${number}/send: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/group/${number}/matrix/reverb/${number}/send: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/group/${number}/eq/highshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/eq/highshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/group/${number}/eq/highshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/group/${number}/eq/highshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/group/${number}/eq/highshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/group/${number}/eq/mid1/enable: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/eq/mid1/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/group/${number}/eq/mid1/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/group/${number}/eq/mid1/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/group/${number}/eq/mid2/enable: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/eq/mid2/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/group/${number}/eq/mid2/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/group/${number}/eq/mid2/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/group/${number}/eq/lowshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/eq/lowshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/group/${number}/eq/lowshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/group/${number}/eq/lowshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/group/${number}/eq/lowshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/group/${number}/leveler/enable: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/leveler/makeup: real
@permission rw
@since v1.0.0
@min 0
@max 100
@unit %

### mix/group/${number}/leveler/reduction: real
@permission rw
@since v1.0.0
@min 0
@max 100
@unit %

### mix/group/${number}/leveler/limit: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/matrix/enable: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/matrix/solo: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/matrix/prefader: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/matrix/panner: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/matrix/mute: real_bool
@permission rw
@since v1.0.0

### mix/group/${number}/matrix/fader: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/reverb/${number}/matrix/aux/${number}/send: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/reverb/${number}/matrix/reverb/${number}/send: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/reverb/${number}/eq/highshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/eq/highshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/reverb/${number}/eq/highshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/reverb/${number}/eq/highshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/reverb/${number}/eq/highshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/reverb/${number}/eq/mid1/enable: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/eq/mid1/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/reverb/${number}/eq/mid1/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/reverb/${number}/eq/mid1/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/reverb/${number}/eq/mid2/enable: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/eq/mid2/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/reverb/${number}/eq/mid2/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/reverb/${number}/eq/mid2/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/reverb/${number}/eq/lowshelf/enable: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/eq/lowshelf/freq: int
@permission rw
@since v1.0.0
@min 20
@max 20000
@unit Hz

### mix/reverb/${number}/eq/lowshelf/gain: real
@permission rw
@since v1.0.0
@min -20
@max 20
@unit dB

### mix/reverb/${number}/eq/lowshelf/bw: real
@permission rw
@since v1.0.0
@min 0.01
@max 3
@unit octaves

### mix/reverb/${number}/eq/lowshelf/mode: real_enum
@permission rw
@since v1.0.0
@enum Shelf=0,Para=1

### mix/reverb/${number}/leveler/enable: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/leveler/makeup: real
@permission rw
@since v1.0.0
@min 0
@max 100
@unit %

### mix/reverb/${number}/leveler/reduction: real
@permission rw
@since v1.0.0
@min 0
@max 100
@unit %

### mix/reverb/${number}/leveler/limit: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/matrix/enable: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/matrix/solo: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/matrix/prefader: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/matrix/panner: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/matrix/mute: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/matrix/fader: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/reverb/${number}/reverb/enable: real_bool
@permission rw
@since v1.0.0

### mix/reverb/${number}/reverb/reverbtime: int
@permission rw
@since v1.0.0
@min 100
@max 60000
@unit ms

### mix/reverb/${number}/reverb/hf: int
@permission rw
@since v1.0.0
@min 500
@max 15000
@unit Hz

### mix/reverb/${number}/reverb/mf: int
@permission rw
@since v1.0.0
@min 500
@max 15000
@unit Hz

### mix/reverb/${number}/reverb/predelay: int
@permission rw
@since v1.0.0
@min 0
@max 500
@unit ms

### mix/reverb/${number}/reverb/mfratio: int
@permission rw
@since v1.0.0
@min 1
@max 100
@unit %

### mix/reverb/${number}/reverb/hfratio: int
@permission rw
@since v1.0.0
@min 1
@max 100
@unit %

### mix/reverb/${number}/reverb/tailspread: int
@permission rw
@since v1.0.0
@min -100
@max 100
@unit %

### mix/reverb/${number}/reverb/mod: int
@permission rw
@since v1.0.0
@min 0
@max 100
@unit %

### mix/monitor/${number}/matrix/enable: real_bool
@permission rw
@since v1.0.0

### mix/monitor/${number}/matrix/mute: real_bool
@permission rw
@since v1.0.0

### mix/monitor/${number}/matrix/fader: real
@permission rw
@since v1.0.0
@min 0
@max 4
@unit linear

### mix/monitor/${number}/assign: int
@permission rw
@since v1.0.0
@min -2
@max 4096

### mix/monitor/${number}/override: int
@permission rw
@since v1.0.0
@min -1
@max 4096

### mix/monitor/${number}/auto: real_bool
@permission rw
@since v1.0.0