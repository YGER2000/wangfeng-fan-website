#!/usr/bin/env bash

set -euo pipefail

# 默认配置，可在运行命令前覆盖
LOCAL_DB=${LOCAL_DB:-wangfeng_fan_website}
LOCAL_DB_USER=${LOCAL_DB_USER:-root}
LOCAL_DB_PASSWORD=${LOCAL_DB_PASSWORD:-123456}

REMOTE_HOST=${REMOTE_HOST:-47.111.177.153}
REMOTE_USER=${REMOTE_USER:-root}
REMOTE_DB=${REMOTE_DB:-wangfeng_fan_website}
REMOTE_DB_USER=${REMOTE_DB_USER:-root}
REMOTE_DB_PASSWORD=${REMOTE_DB_PASSWORD:-'1q3.102w'}

LOCAL_DUMP_DIR=${LOCAL_DUMP_DIR:-backups}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="local_seed_${TIMESTAMP}.sql"
LOCAL_DUMP_PATH="${LOCAL_DUMP_DIR}/${DUMP_FILE}"
REMOTE_TMP_PATH="/tmp/${DUMP_FILE}"

echo "==> 准备本地备份目录：${LOCAL_DUMP_DIR}"
mkdir -p "${LOCAL_DUMP_DIR}"

echo "==> 导出本地数据库 ${LOCAL_DB}"
mysqldump -u "${LOCAL_DB_USER}" -p"${LOCAL_DB_PASSWORD}" \
  --single-transaction --routines --events --triggers \
  "${LOCAL_DB}" > "${LOCAL_DUMP_PATH}"

echo "==> 上传备份到服务器 ${REMOTE_HOST}:${REMOTE_TMP_PATH}"
scp "${LOCAL_DUMP_PATH}" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_TMP_PATH}"

echo "==> 在服务器上重建数据库 ${REMOTE_DB}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s <<EOF
set -euo pipefail
mysql -u "${REMOTE_DB_USER}" -p'${REMOTE_DB_PASSWORD}' -e "DROP DATABASE IF EXISTS \\\`${REMOTE_DB}\\\`; CREATE DATABASE \\\`${REMOTE_DB}\\\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u "${REMOTE_DB_USER}" -p'${REMOTE_DB_PASSWORD}' "${REMOTE_DB}" < "${REMOTE_TMP_PATH}"
rm -f "${REMOTE_TMP_PATH}"
EOF

echo "==> 服务器数据库已重置为本地数据快照。备份保存在 ${LOCAL_DUMP_PATH}"
