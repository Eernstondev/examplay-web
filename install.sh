#!/usr/bin/env bash
# Usage : ./install.sh ~/Documents/examplay-web
set -euo pipefail
DEST="${1:-$HOME/Documents/examplay-web}"

if [ ! -d "$DEST" ]; then
  echo "Dossier introuvable : $DEST"
  echo "Usage : ./install.sh /chemin/vers/examplay-web"
  exit 1
fi

cp -r app/* "$DEST/app/"
cp -r components/* "$DEST/components/"
cp -r lib/* "$DEST/lib/"
cp supabase/migrations/*.sql "$DEST/supabase/migrations/"
mkdir -p "$DEST/supabase/tests"
cp supabase/tests/*.sql "$DEST/supabase/tests/"

echo "Fichiers copiés dans $DEST"
echo
echo "Migration de la base (4 nouvelles) :"
cd "$DEST" && supabase db push
