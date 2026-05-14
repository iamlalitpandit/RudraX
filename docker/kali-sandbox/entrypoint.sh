#!/bin/bash
# RudraX Kali Sandbox Entrypoint
set -e

SSH_PORT="${SSH_PORT:-2222}"

start_ssh() {
    echo "[RudraX Sandbox] Starting SSH server on port ${SSH_PORT}..."
    mkdir -p /run/sshd
    /usr/sbin/sshd -D -p "${SSH_PORT}" &
    SSH_PID=$!
    echo "[RudraX Sandbox] SSH server started (PID: ${SSH_PID})"
}

case "$1" in
    shell|bash)
        start_ssh
        echo "[RudraX Sandbox] Ready. Use 'exit' to quit."
        exec /bin/bash
        ;;
    ssh-only)
        start_ssh
        echo "[RudraX Sandbox] SSH-only mode. Waiting for connections..."
        wait
        ;;
    command|exec)
        start_ssh
        shift
        exec "$@"
        ;;
    *)
        start_ssh
        exec "$@"
        ;;
esac