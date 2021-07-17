STATUS="$(git status)"

if [[ $STATUS == *"nothing to commit, working directory clean"* ]]
then
    sed -i "" '/dist/d' ./.gitignore
    git add .
    git commit -m "Edit .gitignore to publish"
    git subtree push --prefix dist heroku master
    git reset HEAD~
    git checkout .gitignore
else
    echo "Need clean working directory to publish"
fi