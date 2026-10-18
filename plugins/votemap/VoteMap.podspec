Pod::Spec.new do |s|
  s.name = 'VotemapPlugin'
  s.version = '0.1.0'
  s.summary = 'votemap Face ID / keystore plugin'
  s.license = 'MIT'
  s.homepage = 'https://votemap.net'
  s.author = 'votemap'
  s.source = { :git => 'https://github.com/isaacy13/votemap.net', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/VoteMapPlugin/**/*.{swift,h,m}'
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.9'
end
