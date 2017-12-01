echo "Tuning Alda"
GLOBIGNORE=.:..; # GLOBIGNORE includes hidden files in shell outputet * list (can be verified with "echo *")
zip -r9 main.zip ./* -x ./site-packages/\*
cd site-packages
zip -r9 ../main.zip ./*
cd ..
aws lambda update-function-code --function-name Alda --zip-file fileb://main.zip
rm -r main.zip
