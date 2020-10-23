#!/bin/bash

trap "kill 0" EXIT

echo "tsc: Starting compilation in watch mode"
npm run startTSCompiler > /dev/null &
npm run startDevServer
wait
