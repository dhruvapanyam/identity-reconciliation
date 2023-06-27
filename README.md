# Identity Reconciliation

Backend Task for application process to Backend Developer role at Bitespeed

## Implementation Logic

The database can be viewed as multiple trees of contact data. In a tree/heirarchy, a contact `C1` is linked to another contact `C2` if `C1.linkedId == C2.id`.
So, we view the root of a tree to be the primary contact from which other secondary contacts are directly linked to it, and so on.

When a customer submits an email and phoneNumber at the checkout, the `/identify` endpoint searches the database to see if these values are present prior to the checkout.
If both `email = E` and `phoneNumber = P` are already present as the values of some other contacts, we must identify which trees they belong to.

### No new data
Let's say a contact `X` has `X.email = E` and a contact `Y` has `Y.phoneNumber = P`. By traversing the linked list formed by the column `linkedId`, we can find the root of the trees containing X and Y respectively.
Let the root of X's tree be R<sub>X</sub> and the root of Y's tree be R<sub>Y</sub>. If they are the same contact entry, we need not take any further action.
If they are different primary contacts, then we set the newer one to be a secondary contact, linked to the older one.

### New data
If `E` or `P` is new data, that the database does not contain yet, then we must create a new contact. There are 3 cases:
1. If both `E` and `P` are new, then this contact is clearly disjoint from any tree. So, we create a new `Primary(E,P)`.
2. If `E` is new and `P` exists, then we find a contact `Z` such that `Z.phoneNumber == P` and create a contact `Secondary(E,P) of Z`.
3. If `E` exists and `P` is new, then we find a contact `Z` such that `Z.email == E` and create a contact `Secondary(E,P) of Z`.

## Logic not implemented
Structuring the contact trees could be maintained in a more optimal manner by balancing the trees based on the size and length. This will improve the merging algorithm's ttime complexity since we are required to find the primary contact root of each relevant tree. While traversing the tree downwards takes linear time (w.r.t. the size of the tree), merging will be improved given a large scale.

## Running the code

To build and setup the docker image, run ```docker build -t <tagname> .```
Once the image has been built, run a container and expose and publish the `8080` port by running
```docker run -p 8080:8080 <image>```

The API endpoints will be exposed at port `8080`. To submit requests to the API, use the URL `localhost:8080` or `0.0.0.0:8080`. (Note: these are http:// URLs and not https://)

### `/identify` endpoint
This endpoint listens for a POST request with an `email` and `phoneNumber` in the request body. The response will show all the contact details for this corresponding contact.

### `/clear` endpoint
This endpoint listens for a POST request, and subsequently clears the Contact table in the database.