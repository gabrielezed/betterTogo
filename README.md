# betterTogo
Turritan-Italian dictionary based on the original TOGO project.

## What's Togo?
Togo is a web dictionary of the Turritan language written by Masthru Fabriziu Dettori. The Turritan language is a minoritary romance language speaken in the nort-west coast of Sardinia, an Island in the Mediterranean Sea.

## Project Purpose
The original TOGO site is very obsolete and laggy, and its host often crashes. I downloaded their entire words dictionary that was a simple txt file, then with the auxile of a LLM I created a script that filled a SQLite db with every word on the file. Then a minimalistic but functional front-end has been developed.

## Changes
With another script, the following changes are made into the db content to adequate the dictionary at the recent Turritan Language Orthografic Standard:
 - 'Tz' cluster is removed in favor of 'Z'
 - 'K' is changed in 'Ch'

## Notes
This project is moved only by a pragmatic need, hence why I used AI to code it. Please note that I always state in my codebases when code is written by LLMs, because I believe that's the ethical way to do so. 
I am also not a Software Developer, I just code as an hobby; if you find any bugs or security issues, please open an issue or make a pull request.

## Credits
Thanks to the original Togo project https://togo.sassari.tv/
A particular thanks to Masthru Fabritziu Dettori and his active work to preserve the Turritan Language.
