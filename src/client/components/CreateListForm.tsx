/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { Film } from "../../shared/models/films/Film";
import { ListPrivacyType } from "../../shared/models/lists/ListPrivacyType";
import { listService } from "../../shared/services/listService";
import { useModal } from "../../client/contexts/ModalContext";
import { ViewUserLists } from "./ViewUserLists";
import { ModalSize } from "../../shared/models/modals/ModalSize";
import { FilmTile } from "./FilmTile";
import { UserList } from "./UserList";
import { AddToUserList } from "./AddToUserList";
import { useAuth } from "../contexts/AuthContext";

type Props = {
    filmProp?: Film;
}

export function CreateListForm({ filmProp }: Props)
{
    const { user } = useAuth();
    const { showModal } = useModal();
    const [film, setFilm] = useState<Film | null>(filmProp);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ listName?: string, description?: string }>({});
    const [form, setForm] = useState({
        listName: "",
        description: "",
        privacyType: ListPrivacyType.Private
    });

    useEffect(() =>
    {
        if (!user) return;

        setFilm(filmProp);
    }, [filmProp]);

    function handleChange(e)
    {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    }

    async function handleSubmit(e)
    {
        e.preventDefault();

        let valid = true;
        const newErrors: typeof errors = {};

        if (form.listName.trim().length < 3 || form.listName.trim().length > 25)
        {
            newErrors.listName = "List name must be between 3 and 100 characters.";
            valid = false;
        }

        if (form.description.trim().length < 5 || form.description.trim().length > 250)
        {
            newErrors.description = "Description must be between 5 and 250 characters.";
            valid = false;
        }

        setErrors(newErrors);
        if (!valid) return;

        setLoading(true);
        const result = await listService.createList(form.listName, form.description, form.privacyType, film);
        if (result.success)
        {
            setLoading(false);
            const listId = result.data.listId;

            const newList = await listService.getList({ listId });
            if (newList.success)
            {
                showModal(<UserList list={newList.data.list} />, "My lists", ModalSize.Large);
            } else if (newList.success === false)
            {
                console.error(newList.error);
            }
        }
        else if (result.success === false) 
        {
            console.error(result.error);
        }
    }

    const handleBackToLists = () =>
    {
        if (film)
        {
            showModal(<AddToUserList filmProp={film} />, "My lists", ModalSize.Large);
        }
        else
        {
            showModal(<ViewUserLists />, "My lists", ModalSize.Large);
        }
    };

    const listPrivacyTypeOptions = Object.keys(ListPrivacyType)
        .filter(key => isNaN(Number(key)))
        .map(key => (
            <option key={key} value={ListPrivacyType[key]}>
                {key}
            </option>
        ));

    return (
        <>
            <button onClick={handleBackToLists} className="back-to-lists-button">
                <i className="fas fa-arrow-left"></i> Back to Lists
            </button>
            <div className="form-container create-list-form">
                {loading ? (
                    <div className="loading-placeholder pulsate"><span className="loader"></span></div>
                ) : (
                    <>
                        {film && (
                            <div className="">
                                <FilmTile showOptions={false} film={film} />
                            </div>
                        )}
                        <form>
                            <div className="form-input">
                                <label>
                                    List Name:
                                </label>
                                <input type="text" name="listName" value={form.listName} minLength={3} maxLength={25} onChange={handleChange} required />
                                {errors.listName && <div className="error">{errors.listName}</div>}
                            </div>
                            <div className="form-input">
                                <label>
                                    Description:
                                </label>
                                <textarea name="description" value={form.description} minLength={5} maxLength={250} onChange={handleChange} required></textarea>
                                {errors.description && <div className="error">{errors.description}</div>}
                            </div>
                            <div className="form-input">
                                <label>
                                    Privacy Type:
                                </label>
                                <select name="privacyType" value={form.privacyType} onChange={handleChange} required>
                                    {listPrivacyTypeOptions}
                                </select>
                            </div>
                            <button type="submit" onClick={handleSubmit}>Create List</button>
                        </form>
                    </>
                )}
            </div>
        </>
    );
}